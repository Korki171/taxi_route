import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { invalidateSession, validateSessionToken } from "@/server/auth/session";
import { hashToken } from "@/server/auth/tokens";
import { login, switchActiveOrganization } from "@/server/services/auth";
import { registerOrganization } from "@/server/services/registration";
import { addMember, orgInput, register } from "./helpers";

/** Anmeldung ohne zweiten Faktor: gibt die Sitzung zurück. */
async function signIn(input: unknown) {
  const s = await login(input);
  if ("challenge" in s) throw new Error("unerwartet: zweiter Faktor verlangt");
  return s;
}

describe("Passwörter", () => {
  it("hasht mit Salt und verifiziert korrekt", async () => {
    const a = await hashPassword("geheimes-passwort");
    const b = await hashPassword("geheimes-passwort");
    expect(a).not.toBe(b);
    expect(await verifyPassword("geheimes-passwort", a)).toBe(true);
    expect(await verifyPassword("falsch", a)).toBe(false);
    expect(await verifyPassword("x", "kaputt")).toBe(false);
  });
});

describe("Registrierung", () => {
  it("Taxiunternehmen erhält Beförderungs- und Auftraggeberfunktion, beide ungeprüft", async () => {
    const { org, actor } = await register("TRANSPORT_COMPANY");
    expect(org.country).toBe("AT");
    expect(actor.org.role).toBe("OWNER");
    expect(actor.org.capabilities).toEqual({ TRANSPORT_PROVIDER: "UNVERIFIED", TRANSFER_BOOKER: "UNVERIFIED" });
    expect(await db.transportProfile.count({ where: { organizationId: org.id } })).toBe(1);
  });

  it("Reisebüro erhält nur die Auftraggeberfunktion", async () => {
    const { actor } = await register("TRAVEL_AGENCY");
    expect(actor.org.capabilities).toEqual({ TRANSFER_BOOKER: "UNVERIFIED" });
  });

  it("Selbstregistrierung als Plattformadmin oder andere Typen ist nicht möglich", async () => {
    const input = orgInput("TRAVEL_AGENCY") as any;
    input.organization.type = "HOTEL";
    await expect(registerOrganization(input)).rejects.toMatchObject({ code: "VALIDATION" });
    const input2 = orgInput("TRAVEL_AGENCY") as any;
    input2.user.isPlatformAdmin = true;
    const { user } = await registerOrganization(input2);
    expect(user.isPlatformAdmin).toBe(false);
  });

  it("doppelte E-Mail wird abgelehnt, ohne eine halbe Organisation zu hinterlassen", async () => {
    const input = orgInput("TRAVEL_AGENCY");
    await registerOrganization(input);
    await expect(registerOrganization({ ...input, user: { ...input.user, email: input.user.email.toUpperCase() } }))
      .rejects.toMatchObject({ code: "CONFLICT" });
    expect(await db.organization.count()).toBe(1);
  });

  it("zu kurzes Passwort wird abgelehnt", async () => {
    const input = orgInput("TRAVEL_AGENCY");
    input.user.password = "kurz";
    await expect(registerOrganization(input)).rejects.toMatchObject({ code: "VALIDATION" });
  });
});

describe("Login und Sessions", () => {
  it("Login liefert Token; in der DB liegt nur der Hash", async () => {
    const input = orgInput("TRAVEL_AGENCY");
    const { organization } = await registerOrganization(input);
    const { token } = await signIn({ email: input.user.email, password: input.user.password });
    expect(await db.session.findUnique({ where: { id: token } })).toBeNull();
    const s = await validateSessionToken(token);
    expect(s?.id).toBe(hashToken(token));
    expect(s?.activeOrgId).toBe(organization.id);
    await invalidateSession(token);
    expect(await validateSessionToken(token)).toBeNull();
  });

  it("falsches Passwort und unbekannte E-Mail liefern dieselbe Meldung", async () => {
    const input = orgInput("TRAVEL_AGENCY");
    await registerOrganization(input);
    const e1 = await login({ email: input.user.email, password: "falsch-falsch" }).catch((e) => e);
    const e2 = await login({ email: "niemand@example.com", password: "falsch-falsch" }).catch((e) => e);
    expect(e1.code).toBe("UNAUTHENTICATED");
    expect(e1.message).toBe(e2.message);
  });

  it("abgelaufene Session und deaktivierte Nutzer werden abgewiesen", async () => {
    const input = orgInput("TRAVEL_AGENCY");
    const { user } = await registerOrganization(input);
    const { token } = await signIn({ email: input.user.email, password: input.user.password });
    await db.session.update({ where: { id: hashToken(token) }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await validateSessionToken(token)).toBeNull();

    const { token: t2 } = await signIn({ email: input.user.email, password: input.user.password });
    await db.user.update({ where: { id: user.id }, data: { status: "DISABLED" } });
    expect(await validateSessionToken(t2)).toBeNull();
    await expect(login({ email: input.user.email, password: input.user.password })).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });

  it("aktive Organisation kann nur auf eigene Mitgliedschaften gewechselt werden", async () => {
    const a = await register("TRAVEL_AGENCY");
    const b = await register("TRANSPORT_COMPANY");
    const { token } = await signIn({ email: a.user.email, password: "sehr-sicheres-pw" });
    const sid = hashToken(token);
    await expect(switchActiveOrganization(sid, a.user.id, b.org.id)).rejects.toMatchObject({ code: "FORBIDDEN" });

    const m = await addMember(b.org.id, "VIEWER");
    const { token: t2 } = await signIn({ email: m.user.email, password: "x".repeat(12) });
    await db.membership.create({ data: { userId: m.user.id, organizationId: a.org.id, role: "BOOKER" } });
    await switchActiveOrganization(hashToken(t2), m.user.id, a.org.id);
    expect((await validateSessionToken(t2))?.activeOrgId).toBe(a.org.id);
  });
});

describe("Zwei-Faktor-Anmeldung per E-Mail-Code", () => {
  it("nach dem Passwort kommt der Code; erst der richtige Code ergibt eine Sitzung", async () => {
    const { sentEmails } = await import("@/server/email");
    const { setTwoFactorEmail, verifyLoginCode } = await import("@/server/services/auth");
    const input = orgInput("TRANSPORT_COMPANY");
    const { user } = await registerOrganization(input);
    await setTwoFactorEmail(user.id, true);
    sentEmails.length = 0;

    const s = await login({ email: input.user.email, password: input.user.password });
    if (!("challenge" in s)) throw new Error("Code erwartet");
    expect(await db.session.count({ where: { userId: user.id } })).toBe(0);
    expect(sentEmails).toHaveLength(1);
    const code = /Anmeldung: (\d{6})/.exec(sentEmails[0].text)![1];

    const wrong = code === "000000" ? "000001" : "000000";
    await expect(verifyLoginCode(s.challenge, wrong)).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(verifyLoginCode("fremdes-token", code)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    const session = await verifyLoginCode(s.challenge, ` ${code.slice(0, 3)} ${code.slice(3)}`);
    expect(await db.session.findUnique({ where: { id: hashToken(session.token) } })).not.toBeNull();
    // der Code gilt nur einmal
    await expect(verifyLoginCode(s.challenge, code)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("nach fünf falschen Versuchen ist der Code verbraucht; abgelaufene Codes gelten nicht", async () => {
    const { sentEmails } = await import("@/server/email");
    const { setTwoFactorEmail, verifyLoginCode } = await import("@/server/services/auth");
    const input = orgInput("TRANSPORT_COMPANY");
    const { user } = await registerOrganization(input);
    await setTwoFactorEmail(user.id, true);
    const start = async () => {
      sentEmails.length = 0;
      const s = await login({ email: input.user.email, password: input.user.password });
      if (!("challenge" in s)) throw new Error("Code erwartet");
      return { challenge: s.challenge, code: /Anmeldung: (\d{6})/.exec(sentEmails[0].text)![1] };
    };
    const a = await start();
    const wrong = a.code === "000000" ? "000001" : "000000";
    for (let i = 0; i < 5; i++) await expect(verifyLoginCode(a.challenge, wrong)).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(verifyLoginCode(a.challenge, a.code)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });

    const b = await start();
    await db.loginChallenge.updateMany({ where: { userId: user.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await expect(verifyLoginCode(b.challenge, b.code)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });

    // ausgeschaltet: wieder direkt angemeldet
    await setTwoFactorEmail(user.id, false);
    expect("token" in (await login({ email: input.user.email, password: input.user.password }))).toBe(true);
  });
});
