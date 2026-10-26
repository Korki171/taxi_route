import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createSession, validateSessionToken } from "@/server/auth/session";
import { sentEmails } from "@/server/email";
import { rateLimit } from "@/server/rate-limit";
import { login } from "@/server/services/auth";
import { acceptQuote, cancelBooking, createTransferRequest, submitQuote } from "@/server/services/marketplace";
import { checkPasswordResetToken, requestPasswordReset, resetPassword } from "@/server/services/password-reset";
import { register, requestInput, verifiedAgency, verifiedTaxi } from "./helpers";

beforeEach(() => {
  sentEmails.length = 0;
});

const tokenFrom = (text: string) => text.match(/passwort-zuruecksetzen\/([\w-]+)/)![1];

describe("Passwort zurücksetzen", () => {
  it("Link per E-Mail, nur einmal gültig, meldet alle Sitzungen ab", async () => {
    const { user } = await register("TRAVEL_AGENCY");
    const old = await createSession(user.id, null);
    await requestPasswordReset({ email: user.email.toUpperCase() });
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toBe(user.email);
    const token = tokenFrom(sentEmails[0].text);
    await checkPasswordResetToken(token);

    await resetPassword(token, { password: "ganz-neues-passwort" });
    expect(await validateSessionToken(old.token)).toBeNull();
    await expect(login({ email: user.email, password: "sehr-sicheres-pw" })).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    await login({ email: user.email, password: "ganz-neues-passwort" });

    await expect(resetPassword(token, { password: "noch-ein-passwort" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await db.auditEvent.count({ where: { action: "user.password_reset" } })).toBe(1);
  });

  it("verrät nicht, ob eine Adresse registriert ist, und lehnt abgelaufene Links ab", async () => {
    await requestPasswordReset({ email: "niemand@example.com" });
    expect(sentEmails).toHaveLength(0);

    const { user } = await register("TRAVEL_AGENCY");
    await requestPasswordReset({ email: user.email });
    const token = tokenFrom(sentEmails[0].text);
    await db.passwordResetToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    await expect(checkPasswordResetToken(token)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(resetPassword("erfunden", { password: "ganz-neues-passwort" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("zu kurzes neues Passwort wird abgelehnt", async () => {
    const { user } = await register("TRAVEL_AGENCY");
    await requestPasswordReset({ email: user.email });
    await expect(resetPassword(tokenFrom(sentEmails[0].text), { password: "kurz" })).rejects.toMatchObject({ code: "VALIDATION" });
  });
});

describe("Schutz gegen Missbrauch", () => {
  it("begrenzt Versuche je Schlüssel", async () => {
    for (let i = 0; i < 3; i++) await rateLimit("test:a", 3, 10);
    await expect(rateLimit("test:a", 3, 10)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await rateLimit("test:b", 3, 10);
  });

  it("sperrt Passwort-Raten nach 10 Fehlversuchen, auch mit richtigem Passwort", async () => {
    const { user } = await register("TRAVEL_AGENCY");
    for (let i = 0; i < 10; i++) {
      await expect(login({ email: user.email, password: "falsch" })).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    }
    await expect(login({ email: user.email, password: "sehr-sicheres-pw" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("erfolgreiche Anmeldung setzt den Zähler zurück", async () => {
    const { user } = await register("TRAVEL_AGENCY");
    for (let i = 0; i < 9; i++) await login({ email: user.email, password: "falsch" }).catch(() => {});
    await login({ email: user.email, password: "sehr-sicheres-pw" });
    for (let i = 0; i < 9; i++) await login({ email: user.email, password: "falsch" }).catch(() => {});
    await login({ email: user.email, password: "sehr-sicheres-pw" });
  });

  it("begrenzt Reset-Mails je Adresse", async () => {
    const { user } = await register("TRAVEL_AGENCY");
    for (let i = 0; i < 3; i++) await requestPasswordReset({ email: user.email });
    await expect(requestPasswordReset({ email: user.email })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(sentEmails).toHaveLength(3);
  });
});

describe("E-Mail-Benachrichtigungen", () => {
  it("neuer Auftrag, Angebot, Vergabe und Storno erreichen die richtigen Unternehmen ohne Fahrgastdaten", async () => {
    const agency = await verifiedAgency("Reisebüro Alpin");
    const taxi = await verifiedTaxi("Taxi Schwaz");
    const unverified = await register("TRANSPORT_COMPANY");
    const intl = await verifiedTaxi("Munich Cabs");
    await db.organization.update({ where: { id: intl.org.id }, data: { country: "GB" } });

    const req = await createTransferRequest(agency.actor, requestInput());
    const to = (mails: typeof sentEmails) => mails.map((m) => m.to).sort();
    expect(to(sentEmails)).toEqual([intl.org.email, taxi.org.email].sort());
    expect(sentEmails.map((m) => m.to)).not.toContain(unverified.org.email);
    const en = sentEmails.find((m) => m.to === intl.org.email)!;
    expect(en.subject).toContain("New job");
    expect(en.text).toContain("Munich Airport");
    const de = sentEmails.find((m) => m.to === taxi.org.email)!;
    expect(de.subject).toContain("Neuer Auftrag");
    for (const m of sentEmails) {
      expect(m.text).not.toContain("Gruber");
      expect(m.text).not.toContain("Maria-Theresien");
      expect(m.text).toContain(`/boerse/auftrag/${req.id}`);
    }

    sentEmails.length = 0;
    const quote = await submitQuote(taxi.actor, req.id, { amountCents: 22500, vehicleCategory: "VAN" });
    expect(to(sentEmails)).toEqual([agency.org.email]);
    expect(sentEmails[0].text).toContain("Taxi Schwaz");

    sentEmails.length = 0;
    const booking = await acceptQuote(agency.actor, quote.id);
    expect(to(sentEmails)).toEqual([agency.org.email, taxi.org.email].sort());

    sentEmails.length = 0;
    await cancelBooking(agency.actor, booking.id, "Gast krank");
    expect(to(sentEmails)).toEqual([taxi.org.email]);
    expect(sentEmails[0].text).toContain("Gast krank");
  });

  it("ein Fehler beim Versand lässt die Aktion trotzdem gelingen", async () => {
    const agency = await verifiedAgency();
    await verifiedTaxi();
    process.env.RESEND_API_KEY = "test";
    const fetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response("kaputt", { status: 500 })) as typeof globalThis.fetch;
    const err = console.error;
    console.error = () => {};
    try {
      const req = await createTransferRequest(agency.actor, requestInput());
      expect(req.id).toBeTruthy();
    } finally {
      delete process.env.RESEND_API_KEY;
      globalThis.fetch = fetch;
      console.error = err;
    }
  });
});
