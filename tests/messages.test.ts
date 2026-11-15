import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createTransferRequest, takeFixedPriceRequest } from "@/server/services/marketplace";
import { listThreads, sendMessage, updateJobAlerts, addJobAlert, listJobAlerts, removeJobAlert } from "@/server/services/messages";
import { notifyNewRequest } from "@/server/notifications";
import { requestInput, verifiedAgency, verifiedTaxi } from "./helpers";

describe("Nachrichten zum Auftrag", () => {
  it("Rückfrage vor der Übernahme, Antwort des Auftraggebers, Dritte sehen nichts", async () => {
    const agency = await verifiedAgency("Reisebüro A");
    const taxi = await verifiedTaxi("Taxi B");
    const other = await verifiedTaxi("Taxi C");
    const req = await createTransferRequest(agency.actor, requestInput({ priceMode: "FIXED" }));

    await expect(sendMessage(taxi.actor, req.id, { body: "  " })).rejects.toMatchObject({ code: "VALIDATION" });
    await sendMessage(taxi.actor, req.id, { body: "Ist ein Kindersitz nötig?" });
    await sendMessage(other.actor, req.id, { body: "Wie viel Gepäck?" });

    const own = await listThreads(taxi.actor, req.id);
    expect(own.threads).toHaveLength(1);
    expect(own.threads[0].messages.map((m) => m.body)).toEqual(["Ist ein Kindersitz nötig?"]);

    const asRequester = await listThreads(agency.actor, req.id);
    expect(asRequester.threads.map((t) => t.withName).sort()).toEqual(["Taxi B", "Taxi C"]);
    await expect(sendMessage(agency.actor, req.id, { body: "Ja, einer", threadOrgId: agency.org.id })).rejects.toMatchObject({ code: "VALIDATION" });
    await sendMessage(agency.actor, req.id, { body: "Ja, einer", threadOrgId: taxi.org.id });
    const reply = await listThreads(taxi.actor, req.id);
    expect(reply.threads[0].messages.map((m) => m.body)).toEqual(["Ist ein Kindersitz nötig?", "Ja, einer"]);
    expect(reply.threads[0].messages.map((m) => reply.names.get(m.senderOrgId))).toEqual(["Taxi B", "Reisebüro A"]);
    expect((await listThreads(other.actor, req.id)).threads[0].messages.map((m) => m.body)).toEqual(["Wie viel Gepäck?"]);
  });

  it("nach der Vergabe schreibt nur noch der ausführende Betrieb; Fremde bekommen nichts", async () => {
    const agency = await verifiedAgency();
    const taxi = await verifiedTaxi("Taxi B");
    const other = await verifiedTaxi("Taxi C");
    const req = await createTransferRequest(agency.actor, requestInput({ priceMode: "FIXED" }));
    await takeFixedPriceRequest(taxi.actor, req.id);
    await sendMessage(taxi.actor, req.id, { body: "Wir holen Sie am Terminal ab." });
    await expect(sendMessage(other.actor, req.id, { body: "Hallo" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(listThreads(other.actor, req.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("Suchagent", () => {
  it("speichert mehrere Strecken und den Schalter", async () => {
    const taxi = await verifiedTaxi("Taxi B");
    await expect(addJobAlert(taxi.actor, { from: "gibtsnicht" })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(addJobAlert(taxi.actor, {})).rejects.toMatchObject({ code: "VALIDATION" });
    await addJobAlert(taxi.actor, { from: "innsbruck", to: "" });
    await addJobAlert(taxi.actor, { from: "innsbruck", to: "" }); // doppelt: wird nicht zweimal gespeichert
    await addJobAlert(taxi.actor, { from: "muc", to: "kitzbuehel" });
    const list = await listJobAlerts(taxi.actor);
    expect(list.map((a) => [a.fromPlaceId, a.toPlaceId])).toEqual([["innsbruck", null], ["muc", "kitzbuehel"]]);
    await removeJobAlert(taxi.actor, list[0].id);
    expect(await listJobAlerts(taxi.actor)).toHaveLength(1);
    await updateJobAlerts(taxi.actor, { mailNewJobs: false });
    expect((await db.organization.findUniqueOrThrow({ where: { id: taxi.org.id } })).mailNewJobs).toBe(false);
  });

  it("neue Aufträge gehen nur an passende Betriebe", async () => {
    const { sentEmails: outbox } = await import("@/server/email");
    const agency = await verifiedAgency();
    const match = await verifiedTaxi("Taxi Passt");
    const wrong = await verifiedTaxi("Taxi Falsch");
    const off = await verifiedTaxi("Taxi Aus");
    await addJobAlert(match.actor, { from: "kitzbuehel" });
    await addJobAlert(match.actor, { from: "innsbruck", to: "muc" });
    await addJobAlert(wrong.actor, { from: "szg" });
    await updateJobAlerts(off.actor, { mailNewJobs: false });
    const before = outbox.length;
    const req = await createTransferRequest(agency.actor, requestInput());
    await notifyNewRequest(req.id);
    const to = outbox.slice(before).map((e) => e.to);
    expect(to).toContain(match.org.email);
    expect(to).not.toContain(wrong.org.email);
    expect(to).not.toContain(off.org.email);
  });
});
