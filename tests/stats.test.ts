import { describe, expect, it } from "vitest";
import { completeTrip, createTransferRequest, takeFixedPriceRequest } from "@/server/services/marketplace";
import { orgStats } from "@/server/services/stats";
import { requestInput, verifiedTaxi } from "./helpers";

describe("Auswertung", () => {
  it("zählt abgegebene und übernommene Fahrten, Umsatz und Strecken je Unternehmen", async () => {
    const poster = await verifiedTaxi("Taxi Abgeber");
    const taker = await verifiedTaxi("Taxi Nehmer");
    const a = await createTransferRequest(poster.actor, requestInput({ priceMode: "FIXED", priceCents: 20000, handoffSharePercent: 10 }));
    const b = await createTransferRequest(poster.actor, requestInput({ priceMode: "FIXED", priceCents: 30000 }));
    await createTransferRequest(poster.actor, requestInput({ priceMode: "FIXED" })); // bleibt offen
    const ba = await takeFixedPriceRequest(taker.actor, a.id);
    await takeFixedPriceRequest(taker.actor, b.id); // übernommen, noch nicht gefahren
    await completeTrip(taker.actor, ba.id);
    const later = new Date(Date.now() + 3 * 86_400_000);

    const t = await orgStats(taker.actor, 30, later);
    expect(t).toMatchObject({ days: 30, posted: 0, takenRate: null, takenTrips: 1, takenRevenueCents: 18000, handedTrips: 0 });
    expect(t.topRoutes).toEqual([{ pickupPlaceId: "innsbruck", dropoffPlaceId: "muc", trips: 1, avgPriceCents: 20000 }]);

    const p = await orgStats(poster.actor, 30, later);
    expect(p).toMatchObject({ posted: 3, givenAway: 2, takenRate: 67, takenTrips: 0, handedTrips: 1, handedShareCents: 2000, medianTakeMinutes: 0 });
    // unbekannter Zeitraum fällt auf 90 Tage zurück
    expect((await orgStats(poster.actor, 7, later)).days).toBe(90);
  });
});
