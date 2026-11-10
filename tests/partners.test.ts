import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createTransferRequest, getTransferRequest, searchBoard, takeFixedPriceRequest } from "@/server/services/marketplace";
import { addPartner, blockOrg, unblockOrg, advanceAudience, escalateDueRequests, listPartnerCandidates, listPartners, removePartner, takeOwnRequest } from "@/server/services/partners";
import { requestInput, verifiedTaxi } from "./helpers";

async function setup() {
  const poster = await verifiedTaxi("Taxi Abgeber");
  const partner = await verifiedTaxi("Taxi Partner");
  const stranger = await verifiedTaxi("Taxi Fremd");
  await addPartner(poster.actor, partner.org.id);
  return { poster, partner, stranger };
}

describe("Partnernetzwerk und Veröffentlichungsstufen", () => {
  it("Partner verwalten", async () => {
    const { poster, partner, stranger } = await setup();
    expect((await listPartners(poster.actor)).map((p) => p.name)).toEqual(["Taxi Partner"]);
    expect((await listPartnerCandidates(poster.actor)).map((p) => p.name)).toEqual(["Taxi Fremd"]);
    await expect(addPartner(poster.actor, poster.org.id)).rejects.toMatchObject({ code: "VALIDATION" });
    await removePartner(poster.actor, partner.org.id);
    expect(await listPartners(poster.actor)).toEqual([]);
    void stranger;
  });

  it("Stufe 1: nur der eigene Betrieb, Stufe 2: Partner, Stufe 3: alle", async () => {
    const { poster, partner, stranger } = await setup();
    const req = await createTransferRequest(poster.actor, requestInput({ audience: "OWN" }));
    expect(req.audience).toBe("OWN");
    expect(await searchBoard(partner.actor, {})).toEqual([]);
    await expect(takeFixedPriceRequest(partner.actor, req.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(getTransferRequest(partner.actor, req.id)).rejects.toMatchObject({ code: "NOT_FOUND" });

    await advanceAudience(poster.actor, req.id);
    expect((await searchBoard(partner.actor, {})).map((r) => r.id)).toEqual([req.id]);
    expect(await searchBoard(stranger.actor, {})).toEqual([]);

    await advanceAudience(poster.actor, req.id);
    expect((await searchBoard(stranger.actor, {})).map((r) => r.id)).toEqual([req.id]);
    await expect(advanceAudience(poster.actor, req.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("ohne Partner entfällt Stufe 2; Start bei Partnern ohne Partner ist ein Fehler", async () => {
    const solo = await verifiedTaxi("Taxi Solo");
    await expect(createTransferRequest(solo.actor, requestInput({ audience: "PARTNERS" }))).rejects.toMatchObject({ code: "VALIDATION" });
    const req = await createTransferRequest(solo.actor, requestInput({ audience: "OWN" }));
    await advanceAudience(solo.actor, req.id);
    expect((await db.transferRequest.findUniqueOrThrow({ where: { id: req.id } })).audience).toBe("MARKET");
  });

  it("automatische Weitergabe nach Ablauf der Frist", async () => {
    const { poster, partner, stranger } = await setup();
    const req = await createTransferRequest(poster.actor, requestInput({ audience: "OWN", escalateAfterMinutes: 30 }));
    const manual = await createTransferRequest(poster.actor, requestInput({ audience: "OWN" }));
    expect(await escalateDueRequests()).toBe(0);
    const later = new Date(Date.now() + 31 * 60_000);
    expect(await escalateDueRequests(later)).toBe(1); // nur der mit Frist
    expect((await searchBoard(partner.actor, {})).map((r) => r.id)).toEqual([req.id]);
    expect(await escalateDueRequests(new Date(later.getTime() + 31 * 60_000))).toBe(1); // Partner → Börse
    expect((await searchBoard(stranger.actor, {})).map((r) => r.id)).toEqual([req.id]);
    expect((await db.transferRequest.findUniqueOrThrow({ where: { id: manual.id } })).audience).toBe("OWN");
    const events = await db.transferEvent.findMany({ where: { requestId: req.id, type: "request.audience_changed" } });
    expect(events).toHaveLength(2);
  });

  it("Stufe 1: der eigene Betrieb übernimmt selbst", async () => {
    const { poster, partner } = await setup();
    const req = await createTransferRequest(poster.actor, requestInput({ audience: "OWN" }));
    const b = await takeOwnRequest(poster.actor, req.id);
    expect(b.providerOrgId).toBe(poster.org.id);
    expect(b.requesterOrgId).toBe(poster.org.id);
    await expect(takeOwnRequest(poster.actor, req.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(takeOwnRequest(partner.actor, req.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("Sperrliste: gesperrte Firmen sehen keine Aufträge und sind keine Partner mehr", async () => {
    const { poster, partner, stranger } = await setup();
    await blockOrg(poster.actor, partner.org.id);
    await blockOrg(poster.actor, stranger.org.id);
    expect(await listPartners(poster.actor)).toEqual([]);
    const req = await createTransferRequest(poster.actor, requestInput());
    expect(await searchBoard(stranger.actor, {})).toEqual([]);
    expect(await searchBoard(partner.actor, {})).toEqual([]);
    await expect(takeFixedPriceRequest(stranger.actor, req.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await unblockOrg(poster.actor, stranger.org.id);
    expect((await searchBoard(stranger.actor, {})).map((r) => r.id)).toEqual([req.id]);
    await addPartner(poster.actor, partner.org.id); // Partner hinzufügen hebt die Sperre auf
    expect((await searchBoard(partner.actor, {})).map((r) => r.id)).toEqual([req.id]);
  });
});
