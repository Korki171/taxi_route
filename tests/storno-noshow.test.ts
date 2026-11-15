import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { lateCancelFeeCents, noShowAllowedFrom } from "@/lib/cancellation";
import { cancelBooking, createTransferRequest, disputeBooking, reportNoShow, takeFixedPriceRequest } from "@/server/services/marketplace";
import { requestInput, verifiedAgency, verifiedTaxi } from "./helpers";

const hours = (h: number) => new Date(Date.now() + h * 3600_000);

/** Gebucht zum Festpreis 200 €, mit Stornoregel „kostenlos bis 24 h vorher, danach 50 %“. */
async function booked(pickupInHours: number, rule: Record<string, unknown> = { freeCancelHours: 24, lateCancelPercent: 50 }) {
  const agency = await verifiedAgency("Reisebüro A");
  const taxi = await verifiedTaxi("Taxi B");
  const req = await createTransferRequest(agency.actor, requestInput({ priceMode: "FIXED", priceCents: 20000, ...rule }));
  const booking = await takeFixedPriceRequest(taxi.actor, req.id);
  // Abholzeit nachträglich setzen, damit Fristen und No-Show ohne Warten prüfbar sind
  await db.transferRequest.update({ where: { id: req.id }, data: { pickupAt: hours(pickupInHours) } });
  return { agency, taxi, req, booking };
}

describe("Stornoregel berechnen", () => {
  const rule = { freeCancelHours: 24, lateCancelPercent: 50 };
  it("kostenlos vor der Frist, danach Prozent vom Preis, ohne Regel nie", () => {
    expect(lateCancelFeeCents(rule, hours(48), 20000)).toBe(0);
    expect(lateCancelFeeCents(rule, hours(10), 20000)).toBe(10000);
    expect(lateCancelFeeCents({ freeCancelHours: 24, lateCancelPercent: 0 }, hours(1), 20000)).toBe(0);
    expect(lateCancelFeeCents({ freeCancelHours: null, lateCancelPercent: null }, hours(1), 20000)).toBe(0);
  });
});

describe("Auftrag mit Stornoregel", () => {
  it("Regel wird gespeichert und unverändert in die Buchung übernommen", async () => {
    const { req, booking } = await booked(48);
    const r = await db.transferRequest.findUniqueOrThrow({ where: { id: req.id } });
    expect([r.freeCancelHours, r.lateCancelPercent]).toEqual([24, 50]);
    expect([booking.freeCancelHours, booking.lateCancelPercent]).toEqual([24, 50]);
  });

  it("nur eine Hälfte der Regel oder ungültige Werte werden abgelehnt", async () => {
    const agency = await verifiedAgency();
    await expect(createTransferRequest(agency.actor, requestInput({ freeCancelHours: 24 }))).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(createTransferRequest(agency.actor, requestInput({ freeCancelHours: 5, lateCancelPercent: 50 }))).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(createTransferRequest(agency.actor, requestInput({ freeCancelHours: 24, lateCancelPercent: 30 }))).rejects.toMatchObject({ code: "VALIDATION" });
  });
});

describe("Storno durch den Auftraggeber", () => {
  it("innerhalb der Frist kostenlos", async () => {
    const { agency, booking } = await booked(48);
    await cancelBooking(agency.actor, booking.id, "Gast krank");
    const b = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(b.status).toBe("CANCELLED");
    expect(b.feeCents).toBeNull();
    expect(b.cancelledByOrgId).toBe(agency.org.id);
  });

  it("nach der Frist wird die Gebühr berechnet und im Verlauf festgehalten", async () => {
    const { agency, req, booking } = await booked(10);
    await cancelBooking(agency.actor, booking.id, "Flug gestrichen");
    const b = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(b.feeCents).toBe(10000);
    const ev = await db.transferEvent.findFirstOrThrow({ where: { requestId: req.id, type: "booking.cancelled" } });
    expect(ev.data).toMatchObject({ note: "Flug gestrichen", feeCents: 10000 });
  });
});

describe("Storno durch das ausführende Unternehmen", () => {
  it("vor der Abholzeit geht die Fahrt zurück in die Börse, ohne Gebühr", async () => {
    const { taxi, req, booking } = await booked(10);
    await cancelBooking(taxi.actor, booking.id, "Fahrzeug defekt");
    expect(await db.booking.count({ where: { id: booking.id } })).toBe(0);
    expect((await db.transferRequest.findUniqueOrThrow({ where: { id: req.id } })).status).toBe("OPEN");
  });

  it("nach der Abholzeit wird storniert, ohne Gebühr", async () => {
    const { taxi, booking } = await booked(-1);
    await cancelBooking(taxi.actor, booking.id, "Fahrer krank");
    const b = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(b.status).toBe("CANCELLED");
    expect(b.feeCents).toBeNull();
  });
});

describe("No-Show", () => {
  async function atPickup(pickupInHours: number) {
    const ctx = await booked(pickupInHours);
    await db.booking.update({ where: { id: ctx.booking.id }, data: { status: "IN_PROGRESS", tripStage: "AT_PICKUP" } });
    await db.transferRequest.update({ where: { id: ctx.req.id }, data: { status: "IN_PROGRESS" } });
    return ctx;
  }

  it("erst am Abholort und 30 Minuten nach der Abholzeit; dann voller Preis als Gebühr", async () => {
    const early = await atPickup(-0.25);
    await expect(reportNoShow(early.taxi.actor, early.booking.id)).rejects.toMatchObject({ code: "VALIDATION" });
    expect(noShowAllowedFrom(new Date(0)).getTime()).toBe(30 * 60_000);

    const { taxi, req, booking } = await atPickup(-1);
    await reportNoShow(taxi.actor, booking.id, "45 Minuten gewartet");
    const b = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(b.status).toBe("NO_SHOW");
    expect(b.feeCents).toBe(20000);
    expect((await db.transferRequest.findUniqueOrThrow({ where: { id: req.id } })).status).toBe("NO_SHOW");
  });

  it("nicht ohne Ankunft am Abholort, nicht durch den Auftraggeber", async () => {
    const { agency, taxi, booking } = await booked(-1);
    await expect(reportNoShow(taxi.actor, booking.id)).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(reportNoShow(agency.actor, booking.id)).rejects.toBeTruthy();
  });

  it("der Auftraggeber kann über „Problem melden“ widersprechen", async () => {
    const { agency, taxi, booking } = await atPickup(-1);
    await reportNoShow(taxi.actor, booking.id);
    await disputeBooking(agency.actor, booking.id, "Fahrgast stand am anderen Ausgang");
    expect((await db.booking.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe("DISPUTED");
  });
});

