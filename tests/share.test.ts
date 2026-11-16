import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { cancelTransferRequest, createTransferRequest, takeFixedPriceRequest } from "@/server/services/marketplace";
import { sharedRequest } from "@/server/services/share";
import { requestInput, verifiedTaxi } from "./helpers";

describe("Auftrag per Link teilen", () => {
  it("zeigt Strecke, Zeit und Preis ohne Login, aber keine Adressen oder Fahrgastdaten", async () => {
    const poster = await verifiedTaxi("Taxi Abgeber");
    const req = await createTransferRequest(poster.actor, requestInput({ priceMode: "FIXED" }));
    const { shareToken } = await db.transferRequest.findUniqueOrThrow({ where: { id: req.id } });
    expect(shareToken).toMatch(/^[a-f0-9]{32}$/);

    const v = await sharedRequest(shareToken);
    expect(v).toMatchObject({ id: req.id, open: true, pickupPlaceId: "innsbruck", dropoffPlaceId: "muc", passengers: 3, priceCents: 24000, company: "Taxi Abgeber" });
    const text = JSON.stringify(v);
    for (const secret of ["Maria-Theresien", "Gruber", "660 1234567", "LH2471", "RB-4711"]) expect(text).not.toContain(secret);

    expect(await sharedRequest("0".repeat(32))).toBeNull();
    expect(await sharedRequest("../etc")).toBeNull();
  });

  it("vergebene Fahrt bleibt sichtbar, aber nicht mehr offen; zurückgezogene und gezielte Aufträge nicht", async () => {
    const poster = await verifiedTaxi("Taxi Abgeber");
    const taker = await verifiedTaxi("Taxi Nehmer");
    const token = async (id: string) => (await db.transferRequest.findUniqueOrThrow({ where: { id } })).shareToken;

    const taken = await createTransferRequest(poster.actor, requestInput({ priceMode: "FIXED" }));
    await takeFixedPriceRequest(taker.actor, taken.id);
    expect(await sharedRequest(await token(taken.id))).toMatchObject({ open: false });

    const cancelled = await createTransferRequest(poster.actor, requestInput());
    await cancelTransferRequest(poster.actor, cancelled.id);
    expect(await sharedRequest(await token(cancelled.id))).toBeNull();

    const invited = await createTransferRequest(poster.actor, requestInput({ visibility: "INVITED", invitedOrgIds: [taker.org.id] }));
    expect(await sharedRequest(await token(invited.id))).toBeNull();

    const open = await createTransferRequest(poster.actor, requestInput());
    expect(await sharedRequest(await token(open.id), new Date(Date.now() + 80 * 3600_000))).toBeNull();
  });
});
