import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { assignBooking, listDispatchBookings, listDrivers, liveFleet } from "@/server/services/dispatch";
import { advanceTrip, driverOverview, endShift, POSITION_RETENTION_DAYS, purgeOldPositions, recordPositions, startShift } from "@/server/services/driver";
import { createVehicle } from "@/server/services/fleet";
import { createTransferRequest, takeFixedPriceRequest } from "@/server/services/marketplace";
import { addMember, requestInput, verifiedAgency, verifiedTaxi } from "./helpers";

/** Taxiunternehmen mit Fahrzeug, Fahrer und einer gebuchten Fahrt. */
async function setup() {
  const taxi = await verifiedTaxi("Alpen Taxi");
  const agency = await verifiedAgency();
  const driver = await addMember(taxi.org.id, "DRIVER");
  const vehicle = await createVehicle(taxi.actor, { label: "V-Klasse 1", category: "MINIVAN", seats: 6, luggage: 6 });
  const req = await createTransferRequest(agency.actor, requestInput({ priceMode: "FIXED", priceCents: 24000 }));
  const booking = await takeFixedPriceRequest(taxi.actor, req.id);
  return { taxi, agency, driver, vehicle, req, booking };
}

const point = (lat: number, lng: number, msAgo = 0) => ({ lat, lng, accuracy: 8, speed: 20, heading: 90, at: Date.now() - msAgo });

describe("Fahrer-Rolle", () => {
  it("Fahrer sieht nur eigene Fahrten und hat keinen Zugriff auf Börse oder Flotte", async () => {
    const { driver, taxi, booking } = await setup();
    expect((await driverOverview(driver.actor)).trips).toEqual([]);
    await assignBooking(taxi.actor, booking.id, { driverId: driver.user.id });
    expect((await driverOverview(driver.actor)).trips.map((t) => t.id)).toEqual([booking.id]);
    await expect(liveFleet(driver.actor)).rejects.toThrow();
    await expect(assignBooking(driver.actor, booking.id, { driverId: driver.user.id })).rejects.toThrow();
  });

  it("nur Mitglieder mit Fahrerrecht können zugewiesen werden, nur eigene Buchungen", async () => {
    const { taxi, booking, driver } = await setup();
    const finance = await addMember(taxi.org.id, "FINANCE");
    const other = await verifiedTaxi();
    const otherDriver = await addMember(other.org.id, "DRIVER");
    expect((await listDrivers(taxi.actor)).map((d) => d.id)).toEqual([driver.user.id, taxi.user.id]);
    await expect(assignBooking(taxi.actor, booking.id, { driverId: finance.user.id })).rejects.toThrow("keine Fahrten");
    await expect(assignBooking(taxi.actor, booking.id, { driverId: otherDriver.user.id })).rejects.toThrow("keine Fahrten");
    await expect(assignBooking(other.actor, booking.id, { driverId: otherDriver.user.id })).rejects.toThrow("Nicht gefunden");
  });
});

describe("Schicht und Standort", () => {
  it("ohne Zustimmung keine Schicht, ohne Schicht keine Positionen", async () => {
    const { driver } = await setup();
    await expect(recordPositions(driver.actor, [point(47.26, 11.39)])).rejects.toThrow("Keine aktive Schicht");
    await expect(startShift(driver.actor, { consent: false })).rejects.toThrow("Standortfreigabe");
    await startShift(driver.actor, { consent: true });
    const m = await db.membership.findFirstOrThrow({ where: { userId: driver.user.id } });
    expect(m.trackingConsentAt).not.toBeNull();
    // Zustimmung gilt für künftige Schichten weiter
    await endShift(driver.actor);
    await startShift(driver.actor, { consent: false });
  });

  it("Live-Karte zeigt Fahrer, Fahrzeug, Position, Spur und aktuellen Auftrag", async () => {
    const { taxi, driver, vehicle, booking, req } = await setup();
    await assignBooking(taxi.actor, booking.id, { driverId: driver.user.id, vehicleId: vehicle.id });
    await startShift(driver.actor, { consent: true, vehicleId: vehicle.id });
    expect(await recordPositions(driver.actor, [point(47.27, 11.40, 20_000), point(47.26, 11.39, 10_000), point(0, 0, -600_000)])).toEqual({ stored: 2 });

    const live = await liveFleet(taxi.actor);
    expect(live.vehicles).toHaveLength(1);
    const v = live.vehicles[0];
    expect(v).toMatchObject({ driver: driver.user.name, vehicle: "V-Klasse 1", lat: 47.26, lng: 11.39 });
    expect(v.trail).toEqual([[47.27, 11.40], [47.26, 11.39]]);
    expect(v.trip).toMatchObject({ requestId: req.id, status: "CONFIRMED", stage: null });
    expect(v.trip?.pickup.name).toBe("Innsbruck");
    expect(v.trip?.dropoff.name).toBe("Flughafen München");

    // Andere Unternehmen sehen nichts davon
    const other = await verifiedTaxi();
    expect((await liveFleet(other.actor)).vehicles).toEqual([]);

    // Nach Schichtende verschwindet der Fahrer von der Karte, die letzte Position wird entfernt
    await endShift(driver.actor);
    expect((await liveFleet(taxi.actor)).vehicles).toEqual([]);
    const shift = await db.driverShift.findFirstOrThrow({ where: { userId: driver.user.id } });
    expect(shift.lastLat).toBeNull();
  });

  it("Etappe zeigt Start, Ziel, gefahrene Strecke und Fortschritt", async () => {
    const { taxi, driver, booking } = await setup();
    await assignBooking(taxi.actor, booking.id, { driverId: driver.user.id });
    const shift = await startShift(driver.actor, { consent: true });
    await db.driverShift.update({ where: { id: shift.id }, data: { startedAt: new Date(Date.now() - 60 * 60_000) } });

    // Geplant: vom aktuellen Standort zur Abholung, noch kein Fortschritt
    await recordPositions(driver.actor, [point(47.2833, 11.5079, 40 * 60_000)]);
    let v = (await liveFleet(taxi.actor)).vehicles[0];
    expect(v.leg).toMatchObject({ kind: "planned", end: { name: "Innsbruck" }, progress: 0 });

    // „Losfahren“ vor 10 Minuten in Hall, inzwischen kurz vor Innsbruck
    await advanceTrip(driver.actor, booking.id, "TO_PICKUP");
    await db.booking.update({ where: { id: booking.id }, data: { tripStageAt: new Date(Date.now() - 10 * 60_000) } });
    await recordPositions(driver.actor, [point(47.2833, 11.5079, 9 * 60_000), point(47.275, 11.44, 60_000)]);
    v = (await liveFleet(taxi.actor)).vehicles[0];
    expect(v.trail).toHaveLength(2);
    expect(v.leg).toMatchObject({ kind: "to-pickup", start: { name: "Hall in Tirol" }, end: { name: "Innsbruck" } });
    expect(v.leg!.drivenKm).toBeGreaterThan(4);
    expect(v.leg!.remainingKm).toBeGreaterThan(0);
    expect(v.leg!.progress).toBeGreaterThan(50);
    expect(v.leg!.progress).toBeLessThan(100);

    // Mit Fahrgast an Bord beginnt die neue Etappe am Abholort
    await advanceTrip(driver.actor, booking.id, "ON_BOARD");
    v = (await liveFleet(taxi.actor)).vehicles[0];
    expect(v.leg).toMatchObject({ kind: "to-dropoff", start: { name: "Innsbruck" }, end: { name: "Flughafen München" }, drivenKm: 0, progress: 0 });
    expect(v.leg!.etaMinutes).toBeGreaterThan(60);
  });

  it("alter Standortverlauf wird gelöscht", async () => {
    const { driver } = await setup();
    const shift = await startShift(driver.actor, { consent: true });
    await db.positionPing.createMany({
      data: [
        { shiftId: shift.id, lat: 1, lng: 1, recordedAt: new Date(Date.now() - (POSITION_RETENTION_DAYS + 1) * 86_400_000) },
        { shiftId: shift.id, lat: 2, lng: 2, recordedAt: new Date() },
      ],
    });
    await purgeOldPositions();
    expect((await db.positionPing.findMany()).map((p) => p.lat)).toEqual([2]);
  });
});

describe("Fortschritt durch den Fahrer", () => {
  it("auf dem Weg, am Abholort, Fahrgast an Bord, abgeschlossen", async () => {
    const { taxi, driver, booking, req } = await setup();
    await assignBooking(taxi.actor, booking.id, { driverId: driver.user.id });
    await expect(advanceTrip(taxi.actor, booking.id, "TO_PICKUP")).rejects.toThrow("Nicht gefunden");

    await advanceTrip(driver.actor, booking.id, "TO_PICKUP");
    let b = await db.booking.findUniqueOrThrow({ where: { id: booking.id }, include: { request: true } });
    expect(b.status).toBe("IN_PROGRESS");
    expect(b.tripStage).toBe("TO_PICKUP");
    expect(b.request.status).toBe("IN_PROGRESS");

    await advanceTrip(driver.actor, booking.id, "ON_BOARD");
    await expect(advanceTrip(driver.actor, booking.id, "AT_PICKUP")).rejects.toThrow("nicht möglich");
    await advanceTrip(driver.actor, booking.id, "DONE");
    b = await db.booking.findUniqueOrThrow({ where: { id: booking.id }, include: { request: true } });
    expect(b.status).toBe("COMPLETED");
    expect(b.tripStage).toBeNull();
    expect(b.request.status).toBe("COMPLETED");

    const events = await db.transferEvent.findMany({ where: { requestId: req.id }, orderBy: { createdAt: "asc" } });
    expect(events.map((e) => e.type).slice(-3)).toEqual(["booking.started", "booking.on_board", "booking.completed"]);
    expect(await listDispatchBookings(taxi.actor)).toEqual([]);
  });
});
