import { describe, expect, it } from "vitest";
import { completeTrip, createTransferRequest, takeFixedPriceRequest } from "@/server/services/marketplace";
import { listBookingRatings, rateBooking, ratingSummaries } from "@/server/services/ratings";
import { requestInput, verifiedAgency, verifiedTaxi } from "./helpers";

async function booked() {
  const agency = await verifiedAgency("Reisebüro A");
  const taxi = await verifiedTaxi("Taxi B");
  const other = await verifiedTaxi("Taxi C");
  const req = await createTransferRequest(agency.actor, requestInput({ priceMode: "FIXED" }));
  const booking = await takeFixedPriceRequest(taxi.actor, req.id);
  return { agency, taxi, other, booking };
}

describe("Bewertungen nach der Fahrt", () => {
  it("erst nach der Fahrt, jede Seite einmal, Schnitt je Firma", async () => {
    const { agency, taxi, other, booking } = await booked();
    await expect(rateBooking(agency.actor, booking.id, { stars: 5 })).rejects.toMatchObject({ code: "VALIDATION" });
    await completeTrip(taxi.actor, booking.id);
    await expect(rateBooking(other.actor, booking.id, { stars: 5 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(rateBooking(agency.actor, booking.id, { stars: 6 })).rejects.toMatchObject({ code: "VALIDATION" });
    await rateBooking(agency.actor, booking.id, { stars: 4, comment: " Pünktlich " });
    await expect(rateBooking(agency.actor, booking.id, { stars: 1 })).rejects.toMatchObject({ code: "CONFLICT" });
    await rateBooking(taxi.actor, booking.id, { stars: 5 });

    const sums = await ratingSummaries([taxi.org.id, agency.org.id, other.org.id]);
    expect(sums.get(taxi.org.id)).toEqual({ avg: 4, count: 1 });
    expect(sums.get(agency.org.id)).toEqual({ avg: 5, count: 1 });
    expect(sums.has(other.org.id)).toBe(false);

    const list = await listBookingRatings(taxi.actor, booking.id);
    expect(list.find((r) => r.fromOrgId === agency.org.id)).toMatchObject({ stars: 4, comment: "Pünktlich" });
    expect(await listBookingRatings(other.actor, booking.id)).toEqual([]);
  });
});
