import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { checkText } from "@/lib/text-filter";
import { completeTrip, createTransferRequest, takeFixedPriceRequest } from "@/server/services/marketplace";
import {
  adminListRatingReports, adminResolveRatingReport, listBookingRatings, rateBooking, ratingSummaries, replyToRating, reportRating,
} from "@/server/services/ratings";
import { createAdmin, requestInput, verifiedAgency, verifiedTaxi } from "./helpers";

const AS_REQUESTER = { communication: 5, punctuality: 4, passengerCare: 3 };
const AS_PROVIDER = { communication: 5, fairness: 5, payment: 5 };

async function booked(names = { agency: "Taxi Auftraggeber", taxi: "Taxi B" }) {
  const agency = await verifiedAgency(names.agency);
  const taxi = await verifiedTaxi(names.taxi);
  const other = await verifiedTaxi("Taxi C");
  const req = await createTransferRequest(agency.actor, requestInput({ priceMode: "FIXED" }));
  const booking = await takeFixedPriceRequest(taxi.actor, req.id);
  return { agency, taxi, other, booking };
}

describe("Wortfilter", () => {
  it("sperrt Beleidigungen auch in Umschreibungen, lässt sachliche Kritik durch", () => {
    for (const bad of ["Totales Arschloch", "A r s c h", "A*schloch", "4rschl0ch", "Scheißfirma", "fucking scammer"]) {
      expect(checkText(bad)).toEqual({ ok: false, reason: "insult" });
    }
    for (const ok of ["Fahrer 20 Minuten zu spät, Auto dreckig", "Am 17.11.2026 um 10:00, Flug LH 2471", "Schwein gehabt, Sauna im Hotel", "Marsch zum Terminal"]) {
      expect(checkText(ok)).toEqual({ ok: true });
    }
  });

  it("sperrt Telefonnummern, E-Mail-Adressen und Links", () => {
    for (const c of ["Ruf an: 0664 1234567", "+43 512 123456", "x@firma.at", "siehe www.firma.at", "https://x.de"]) {
      expect(checkText(c)).toEqual({ ok: false, reason: "contact" });
    }
  });
});

describe("Bewertungen nach der Fahrt", () => {
  it("erst nach der Fahrt, nur Beteiligte, je Rolle die eigenen Kategorien, jede Seite einmal", async () => {
    const { agency, taxi, other, booking } = await booked();
    await expect(rateBooking(agency.actor, booking.id, AS_REQUESTER)).rejects.toMatchObject({ code: "VALIDATION" });
    await completeTrip(taxi.actor, booking.id);
    await expect(rateBooking(other.actor, booking.id, AS_REQUESTER)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(rateBooking(agency.actor, booking.id, AS_PROVIDER)).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(rateBooking(agency.actor, booking.id, { ...AS_REQUESTER, punctuality: 6 })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(rateBooking(agency.actor, booking.id, { ...AS_REQUESTER, comment: "Vollidiot" })).rejects.toMatchObject({ code: "VALIDATION" });

    const r = await rateBooking(agency.actor, booking.id, { ...AS_REQUESTER, comment: " Pünktlich " });
    expect(r.stars).toBe(4);
    expect(r.comment).toBe("Pünktlich");
    await expect(rateBooking(agency.actor, booking.id, AS_REQUESTER)).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("verdeckt, bis beide bewertet haben; danach für beide sichtbar", async () => {
    const { agency, taxi, booking } = await booked();
    await completeTrip(taxi.actor, booking.id);
    await rateBooking(agency.actor, booking.id, AS_REQUESTER);

    // Das Taxi sieht die Bewertung noch nicht, sie zählt auch nicht im Schnitt
    expect(await listBookingRatings(taxi.actor, booking.id)).toEqual([]);
    expect((await ratingSummaries([taxi.org.id])).get(taxi.org.id)).toMatchObject({ count: 0, rides: 1 });
    const own = await listBookingRatings(agency.actor, booking.id);
    expect(own).toHaveLength(1);
    expect(own[0].visible).toBe(false);

    await rateBooking(taxi.actor, booking.id, AS_PROVIDER);
    const seen = await listBookingRatings(taxi.actor, booking.id);
    expect(seen.find((x) => x.toOrgId === taxi.org.id)).toMatchObject({ visible: true, stars: 4 });
    expect((await ratingSummaries([taxi.org.id])).get(taxi.org.id)).toMatchObject({ avg: 4, count: 1, rides: 1 });
  });

  it("nach 104 Tagen auch einseitig sichtbar, danach keine Bewertung mehr möglich", async () => {
    const { agency, taxi, booking } = await booked();
    await completeTrip(taxi.actor, booking.id);
    await rateBooking(agency.actor, booking.id, AS_REQUESTER);
    await db.booking.update({ where: { id: booking.id }, data: { completedAt: new Date(Date.now() - 105 * 24 * 3600_000) } });

    expect((await listBookingRatings(taxi.actor, booking.id))[0]).toMatchObject({ visible: true });
    expect((await ratingSummaries([taxi.org.id])).get(taxi.org.id)).toMatchObject({ count: 1 });
    await expect(rateBooking(taxi.actor, booking.id, AS_PROVIDER)).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("Kommentare sehen nur die Beteiligten; eine Antwort, gefiltert", async () => {
    const { agency, taxi, other, booking } = await booked();
    await completeTrip(taxi.actor, booking.id);
    const r = await rateBooking(agency.actor, booking.id, { ...AS_REQUESTER, comment: "Etwas spät" });
    await expect(replyToRating(taxi.actor, r.id, "Danke")).rejects.toMatchObject({ code: "VALIDATION" }); // noch verdeckt
    await rateBooking(taxi.actor, booking.id, AS_PROVIDER);

    expect(await listBookingRatings(other.actor, booking.id)).toEqual([]);
    await expect(replyToRating(agency.actor, r.id, "Antwort")).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(replyToRating(taxi.actor, r.id, "Ruf an 0664 1234567")).rejects.toMatchObject({ code: "VALIDATION" });
    await replyToRating(taxi.actor, r.id, "Stau auf der A12, sorry");
    await expect(replyToRating(taxi.actor, r.id, "Nochmal")).rejects.toMatchObject({ code: "CONFLICT" });
    const mine = (await listBookingRatings(agency.actor, booking.id)).find((x) => x.id === r.id);
    expect(mine).toMatchObject({ comment: "Etwas spät", reply: "Stau auf der A12, sorry" });
  });

  it("Melden und Ausblenden durch Admins: Kommentar weg, Sterne bleiben", async () => {
    const { agency, taxi, other, booking } = await booked();
    await completeTrip(taxi.actor, booking.id);
    const r = await rateBooking(agency.actor, booking.id, { ...AS_REQUESTER, comment: "Nie wieder" });
    await rateBooking(taxi.actor, booking.id, AS_PROVIDER);

    await expect(reportRating(other.actor, r.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await reportRating(taxi.actor, r.id, "unsachlich");
    await expect(reportRating(taxi.actor, r.id)).rejects.toMatchObject({ code: "CONFLICT" });

    const admin = await createAdmin();
    await expect(adminListRatingReports(taxi.actor)).rejects.toBeTruthy();
    const [rep] = await adminListRatingReports(admin);
    expect(rep.rating.comment).toBe("Nie wieder");
    await adminResolveRatingReport(admin, rep.id, true);

    expect(await adminListRatingReports(admin)).toEqual([]);
    const seen = (await listBookingRatings(taxi.actor, booking.id)).find((x) => x.id === r.id);
    expect(seen).toMatchObject({ comment: null, stars: 4 });
    expect((await ratingSummaries([taxi.org.id])).get(taxi.org.id)).toMatchObject({ count: 1 });
  });
});
