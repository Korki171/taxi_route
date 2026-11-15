import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { blockOrg } from "@/server/services/partners";
import { awardTender, closeTender, createTender, getTender, listOpenTenders, listOwnTenders, submitTenderBid, withdrawTenderBid } from "@/server/services/tenders";
import { verifiedAgency, verifiedTaxi } from "./helpers";

const day = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10);
const input = (over: Record<string, unknown> = {}) => ({ pickupPlaceId: "muc", dropoffPlaceId: "kitzbuehel", dateFrom: day(20), dateTo: day(110), estimatedTrips: 40, ...over });

describe("Ausschreibungen", () => {
  it("ausschreiben, bieten, vergleichen und Zuschlag geben", async () => {
    const agency = await verifiedAgency("Reisebüro Saison");
    const a = await verifiedTaxi("Taxi Günstig");
    const b = await verifiedTaxi("Taxi Teuer");
    const tender = await createTender(agency.actor, input({ bothDirections: "on" }));
    expect(tender.status).toBe("OPEN");
    expect(tender.bothDirections).toBe(true);
    expect(tender.bidDeadline.getTime()).toBeGreaterThan(Date.now() + 6 * 86_400_000);

    expect((await listOpenTenders(a.actor)).map((t) => t.id)).toEqual([tender.id]);
    // Kontaktdaten des Auftraggebers bleiben bis zum Zuschlag verborgen
    expect((await getTender(a.actor, tender.id)).tender.requesterOrg.email).toBeNull();

    await submitTenderBid(a.actor, tender.id, { pricePerTripCents: 21000 });
    await submitTenderBid(b.actor, tender.id, { pricePerTripCents: 26000, message: "Auch Busse" });
    await submitTenderBid(a.actor, tender.id, { pricePerTripCents: 20000 }); // Angebot ändern

    const own = await getTender(agency.actor, tender.id);
    expect(own.role).toBe("requester");
    expect(own.bids.map((x) => [x.providerOrg.name, x.pricePerTripCents])).toEqual([["Taxi Günstig", 20000], ["Taxi Teuer", 26000]]);
    // ein Betrieb sieht nur das eigene Angebot
    expect((await getTender(b.actor, tender.id)).bids.map((x) => x.providerOrgId)).toEqual([b.org.id]);
    expect((await listOwnTenders(agency.actor))[0]._count.bids).toBe(2);

    await expect(awardTender(b.actor, own.bids[0].id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await awardTender(agency.actor, own.bids[0].id);
    const after = await db.tender.findUniqueOrThrow({ where: { id: tender.id }, include: { bids: { orderBy: { pricePerTripCents: "asc" } } } });
    expect(after.status).toBe("AWARDED");
    expect(after.bids.map((x) => x.status)).toEqual(["ACCEPTED", "REJECTED"]);
    expect(await listOpenTenders(b.actor)).toEqual([]);
    // der Gewinner sieht jetzt die Kontaktdaten
    expect((await getTender(a.actor, tender.id)).tender.requesterOrg.email).toBe(agency.org.email);
    await expect(awardTender(agency.actor, after.bids[1].id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(submitTenderBid(b.actor, tender.id, { pricePerTripCents: 15000 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("zurückziehen, beenden, Sperrliste und Eingabeprüfung", async () => {
    const agency = await verifiedAgency();
    const a = await verifiedTaxi();
    const blocked = await verifiedTaxi();
    await blockOrg(agency.actor, blocked.org.id);
    await expect(createTender(agency.actor, input({ dropoffPlaceId: "muc" }))).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(createTender(agency.actor, input({ dateTo: day(10) }))).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(createTender(agency.actor, input({ estimatedTrips: 1 }))).rejects.toMatchObject({ code: "VALIDATION" });
    const tender = await createTender(agency.actor, input());

    expect(await listOpenTenders(blocked.actor)).toEqual([]);
    await expect(getTender(blocked.actor, tender.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(submitTenderBid(blocked.actor, tender.id, { pricePerTripCents: 10000 })).rejects.toMatchObject({ code: "NOT_FOUND" });

    await submitTenderBid(a.actor, tender.id, { pricePerTripCents: 22000 });
    await withdrawTenderBid(a.actor, tender.id);
    expect((await getTender(agency.actor, tender.id)).bids).toEqual([]);
    await expect(withdrawTenderBid(a.actor, tender.id)).rejects.toMatchObject({ code: "VALIDATION" });
    await submitTenderBid(a.actor, tender.id, { pricePerTripCents: 23000 }); // erneut bieten

    await closeTender(agency.actor, tender.id);
    expect((await db.tenderBid.findFirstOrThrow({ where: { tenderId: tender.id } })).status).toBe("REJECTED");
    expect(await listOpenTenders(a.actor)).toEqual([]);
    await expect(closeTender(agency.actor, tender.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
