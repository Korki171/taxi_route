import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { noShowAllowedFrom } from "@/lib/cancellation";
import { addBookingStatement, cancelBooking, createTransferRequest, disputeBooking, reportNoShow, takeFixedPriceRequest } from "@/server/services/marketplace";
import { getBookingConfirmation } from "@/server/services/confirmation";
import { renderConfirmationPdf } from "@/server/pdf/confirmation";
import { requestInput, verifiedAgency, verifiedTaxi } from "./helpers";

const hours = (h: number) => new Date(Date.now() + h * 3600_000);
const TERMS = "Kostenlos bis 24 Stunden vor Abholung, danach 50 % des Fahrpreises.";

/** Zum Festpreis 200 € gebucht, mit Stornobedingungen als Freitext. */
async function booked(pickupInHours: number, extra: Record<string, unknown> = {}) {
  const agency = await verifiedAgency("Taxi Auftraggeber");
  const taxi = await verifiedTaxi("Taxi B");
  const req = await createTransferRequest(agency.actor, requestInput({ priceMode: "FIXED", priceCents: 20000, cancellationTerms: TERMS, ...extra }));
  const booking = await takeFixedPriceRequest(taxi.actor, req.id);
  // Abholzeit nachträglich setzen, damit No-Show ohne Warten prüfbar ist
  await db.transferRequest.update({ where: { id: req.id }, data: { pickupAt: hours(pickupInHours) } });
  return { agency, taxi, req, booking };
}

describe("Stornobedingungen als Freitext", () => {
  it("werden mit der Annahme unverändert in die Buchung übernommen", async () => {
    const { booking } = await booked(48);
    expect(booking.cancellationTerms).toBe(TERMS);
  });
});

describe("Storno", () => {
  it("durch den Auftraggeber: storniert und dokumentiert, ohne Gebühr", async () => {
    const { agency, req, booking } = await booked(2);
    await cancelBooking(agency.actor, booking.id, "Flug gestrichen");
    const b = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(b.status).toBe("CANCELLED");
    expect(b.cancelledByOrgId).toBe(agency.org.id);
    expect(b.cancelledAt).toBeInstanceOf(Date);
    const ev = await db.transferEvent.findFirstOrThrow({ where: { requestId: req.id, type: "booking.cancelled" } });
    expect(ev.data).toEqual({ note: "Flug gestrichen" });
  });

  it("durch das ausführende Unternehmen vor der Abholzeit: zurück in die Börse", async () => {
    const { taxi, req, booking } = await booked(10);
    await cancelBooking(taxi.actor, booking.id, "Fahrzeug defekt");
    expect(await db.booking.count({ where: { id: booking.id } })).toBe(0);
    expect((await db.transferRequest.findUniqueOrThrow({ where: { id: req.id } })).status).toBe("OPEN");
  });

  it("durch das ausführende Unternehmen nach der Abholzeit: storniert", async () => {
    const { taxi, booking } = await booked(-1);
    await cancelBooking(taxi.actor, booking.id, "Fahrer krank");
    expect((await db.booking.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe("CANCELLED");
  });
});

describe("No-Show", () => {
  async function atPickup(pickupInHours: number, extra: Record<string, unknown> = {}) {
    const ctx = await booked(pickupInHours, extra);
    await db.booking.update({ where: { id: ctx.booking.id }, data: { status: "IN_PROGRESS", tripStage: "AT_PICKUP" } });
    await db.transferRequest.update({ where: { id: ctx.req.id }, data: { status: "IN_PROGRESS" } });
    return ctx;
  }

  it("Wartezeit 30 Minuten, mit Flugnummer 60", () => {
    expect(noShowAllowedFrom(new Date(0)).getTime()).toBe(30 * 60_000);
    expect(noShowAllowedFrom(new Date(0), "LH 2471").getTime()).toBe(60 * 60_000);
  });

  it("erst am Abholort nach der Wartezeit; nur dokumentiert", async () => {
    const early = await atPickup(-0.25);
    await expect(reportNoShow(early.taxi.actor, early.booking.id)).rejects.toMatchObject({ code: "VALIDATION" });

    const flight = await atPickup(-0.75, { flightNumber: "LH 2471" });
    await expect(reportNoShow(flight.taxi.actor, flight.booking.id)).rejects.toMatchObject({ code: "VALIDATION" });

    const { taxi, req, booking } = await atPickup(-1);
    await reportNoShow(taxi.actor, booking.id, "45 Minuten gewartet");
    expect((await db.booking.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe("NO_SHOW");
    expect((await db.transferRequest.findUniqueOrThrow({ where: { id: req.id } })).status).toBe("NO_SHOW");
  });

  it("nicht ohne Ankunft am Abholort, nicht durch den Auftraggeber", async () => {
    const { agency, taxi, booking } = await booked(-1);
    await expect(reportNoShow(taxi.actor, booking.id)).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(reportNoShow(agency.actor, booking.id)).rejects.toBeTruthy();
  });

  it("kein „Problem melden“ mehr, stattdessen je Seite eine Stellungnahme", async () => {
    const { agency, taxi, req, booking } = await atPickup(-1);
    await reportNoShow(taxi.actor, booking.id);
    await expect(disputeBooking(agency.actor, booking.id, "Fahrgast stand am anderen Ausgang")).rejects.toMatchObject({ code: "VALIDATION" });

    await addBookingStatement(agency.actor, booking.id, "Fahrgast stand am Ausgang B");
    await addBookingStatement(taxi.actor, booking.id, "Ausgang B war gesperrt");
    await expect(addBookingStatement(agency.actor, booking.id, "Noch etwas")).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await db.booking.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe("NO_SHOW");
    expect(await db.transferEvent.count({ where: { requestId: req.id, type: "booking.statement" } })).toBe(2);
  });
});

describe("Stellungnahme und Storno-Beleg", () => {
  it("Stellungnahme nur zu Storno oder No-Show", async () => {
    const { agency, booking } = await booked(48);
    await expect(addBookingStatement(agency.actor, booking.id, "Hinweis")).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("Storno-Beleg enthält Storno und Stellungnahme", async () => {
    const { agency, taxi, booking } = await booked(2);
    await cancelBooking(agency.actor, booking.id, "Flug gestrichen");
    await addBookingStatement(taxi.actor, booking.id, "Fahrer war schon unterwegs");
    const data = await getBookingConfirmation(taxi.actor, booking.id);
    expect(data.closing.map((e) => e.type)).toEqual(["booking.cancelled", "booking.statement"]);
    const pdf = await renderConfirmationPdf(data, "de", "cancellation");
    expect(Buffer.from(pdf).subarray(0, 5).toString()).toBe("%PDF-");
  });
});
