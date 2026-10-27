import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission, type Actor, type OrgActor } from "../authz/context";
import { invalid, notFound } from "../errors";
import { parse } from "../validation";
import { audit } from "./audit";
import { transitionBooking } from "./marketplace";
import { transferEvent } from "./transfer-events";

/** So lange bleibt der Standortverlauf gespeichert (Nachweis bei Beanstandungen), danach wird er gelöscht. */
export const POSITION_RETENTION_DAYS = 30;

/** Ohne neue Position seit dieser Zeit gilt ein Fahrzeug auf der Karte als „kein Signal“. */
export const POSITION_STALE_SECONDS = 120;

function openShift(actor: OrgActor) {
  return db.driverShift.findFirst({
    where: { userId: actor.userId, organizationId: actor.org.id, endedAt: null },
    orderBy: { startedAt: "desc" },
    include: { vehicle: { select: { id: true, label: true, licensePlate: true } } },
  });
}

export async function purgeOldPositions() {
  await db.positionPing.deleteMany({ where: { recordedAt: { lt: new Date(Date.now() - POSITION_RETENTION_DAYS * 86_400_000) } } });
}

/** Alles, was die Fahrer-Ansicht braucht: Schicht, Zustimmung, Fahrzeuge und die eigenen Fahrten. */
export async function driverOverview(actor: Actor | null) {
  requirePermission(actor, "trips.drive");
  const [shift, membership, vehicles, trips] = await Promise.all([
    openShift(actor),
    db.membership.findUnique({ where: { userId_organizationId: { userId: actor.userId, organizationId: actor.org.id } } }),
    db.vehicle.findMany({ where: { organizationId: actor.org.id, active: true }, orderBy: { label: "asc" } }),
    db.booking.findMany({
      where: {
        driverId: actor.userId,
        providerOrgId: actor.org.id,
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
      },
      orderBy: { request: { pickupAt: "asc" } },
      take: 50,
      include: {
        vehicle: { select: { label: true, licensePlate: true } },
        requesterOrg: { select: { name: true, phone: true } },
        request: { include: { passengersContact: true } },
      },
    }),
  ]);
  return { shift, consentAt: membership?.trackingConsentAt ?? null, vehicles, trips };
}

const startSchema = z.object({
  vehicleId: z.string().optional().transform((v) => v || undefined),
  consent: z.boolean(),
});

/**
 * Beginnt eine Schicht. Vor der ersten Schicht muss der Fahrer der Standortfreigabe zustimmen;
 * die Zustimmung wird mit Zeitpunkt an der Mitgliedschaft gespeichert.
 */
export async function startShift(actor: Actor | null, input: unknown) {
  requirePermission(actor, "trips.drive");
  const data = parse(startSchema, input);
  const membership = await db.membership.findUniqueOrThrow({
    where: { userId_organizationId: { userId: actor.userId, organizationId: actor.org.id } },
  });
  if (!membership.trackingConsentAt && !data.consent) {
    throw invalid("Bitte bestätigen Sie die Standortfreigabe während der Schicht.");
  }
  if (data.vehicleId) {
    const v = await db.vehicle.findFirst({ where: { id: data.vehicleId, organizationId: actor.org.id, active: true } });
    if (!v) throw invalid("Fahrzeug nicht gefunden.");
  }
  const shift = await db.$transaction(async (tx) => {
    if (!membership.trackingConsentAt) {
      await tx.membership.update({ where: { id: membership.id }, data: { trackingConsentAt: new Date() } });
    }
    // Höchstens eine offene Schicht je Fahrer und Unternehmen.
    await tx.driverShift.updateMany({
      where: { userId: actor.userId, organizationId: actor.org.id, endedAt: null },
      data: { endedAt: new Date(), lastLat: null, lastLng: null, lastAccuracy: null, lastSpeed: null, lastHeading: null },
    });
    return tx.driverShift.create({ data: { organizationId: actor.org.id, userId: actor.userId, vehicleId: data.vehicleId } });
  });
  await audit(db, { actorUserId: actor.userId, organizationId: actor.org.id, action: "shift.started", targetId: shift.id });
  await purgeOldPositions();
  return shift;
}

/** Beendet die Schicht. Danach ist der Fahrer auf der Karte nicht mehr sichtbar. */
export async function endShift(actor: Actor | null) {
  requirePermission(actor, "trips.drive");
  const res = await db.driverShift.updateMany({
    where: { userId: actor.userId, organizationId: actor.org.id, endedAt: null },
    data: { endedAt: new Date(), lastLat: null, lastLng: null, lastAccuracy: null, lastSpeed: null, lastHeading: null },
  });
  if (res.count === 0) throw invalid("Keine aktive Schicht.");
  await audit(db, { actorUserId: actor.userId, organizationId: actor.org.id, action: "shift.ended" });
}

const optNum = (min: number, max: number) =>
  z.number().finite().min(min).max(max).nullish().transform((v) => v ?? null);

const pointSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
  accuracy: optNum(0, 100_000),
  speed: optNum(0, 120),
  heading: optNum(0, 360),
  /** Zeitpunkt der Messung (ms seit 1970), vom Gerät */
  at: z.number().int(),
});

const pointsSchema = z.array(pointSchema).min(1).max(100);

/**
 * Speichert Positionen der laufenden Schicht. Das Handy schickt mehrere Punkte auf einmal,
 * wenn es kurz keine Verbindung hatte. Punkte aus der Zukunft oder von vor Schichtbeginn
 * werden verworfen.
 */
export async function recordPositions(actor: Actor | null, input: unknown) {
  requirePermission(actor, "trips.drive");
  const points = parse(pointsSchema, input);
  const shift = await openShift(actor);
  if (!shift) throw invalid("Keine aktive Schicht.");
  const now = Date.now();
  const valid = points
    .filter((p) => p.at <= now + 60_000 && p.at >= shift.startedAt.getTime() - 60_000)
    .sort((a, b) => a.at - b.at);
  if (valid.length === 0) return { stored: 0 };
  const last = valid[valid.length - 1];
  const newer = !shift.lastPositionAt || last.at >= shift.lastPositionAt.getTime();
  await db.$transaction([
    db.positionPing.createMany({
      data: valid.map((p) => ({
        shiftId: shift.id,
        lat: p.lat,
        lng: p.lng,
        accuracy: p.accuracy,
        speed: p.speed,
        heading: p.heading,
        recordedAt: new Date(p.at),
      })),
    }),
    ...(newer
      ? [db.driverShift.update({
          where: { id: shift.id },
          data: {
            lastLat: last.lat,
            lastLng: last.lng,
            lastAccuracy: last.accuracy,
            lastSpeed: last.speed,
            lastHeading: last.heading,
            lastPositionAt: new Date(last.at),
          },
        })]
      : []),
  ]);
  return { stored: valid.length };
}

export const TRIP_STEPS = ["TO_PICKUP", "AT_PICKUP", "ON_BOARD", "DONE"] as const;
export type TripStep = (typeof TRIP_STEPS)[number];

/**
 * Fahrer meldet den Fortschritt einer ihm zugewiesenen Fahrt. „Auf dem Weg“ beginnt die Fahrt
 * (Buchung „unterwegs“), „Abgeschlossen“ meldet sie als durchgeführt. Zurück geht es nicht.
 */
export async function advanceTrip(actor: Actor | null, bookingId: string, step: string) {
  requirePermission(actor, "trips.drive");
  if (!(TRIP_STEPS as readonly string[]).includes(step)) throw invalid("Unbekannter Schritt.");
  const b = await db.booking.findFirst({ where: { id: bookingId, providerOrgId: actor.org.id, driverId: actor.userId } });
  if (!b) throw notFound();
  if (b.status !== "CONFIRMED" && b.status !== "IN_PROGRESS") {
    throw invalid("Dieser Statuswechsel ist im aktuellen Zustand nicht möglich.");
  }
  const current = b.tripStage ? TRIP_STEPS.indexOf(b.tripStage) : -1;
  if (TRIP_STEPS.indexOf(step as TripStep) <= current) {
    throw invalid("Dieser Statuswechsel ist im aktuellen Zustand nicht möglich.");
  }

  if (step === "DONE") {
    await transitionBooking(actor, b.id, "provider", ["CONFIRMED", "IN_PROGRESS"], "COMPLETED", "booking.completed");
    return;
  }
  if (b.status === "CONFIRMED") {
    await transitionBooking(actor, b.id, "provider", ["CONFIRMED"], "IN_PROGRESS", "booking.started");
  }
  await db.$transaction(async (tx) => {
    await tx.booking.update({ where: { id: b.id }, data: { tripStage: step as Exclude<TripStep, "DONE">, tripStageAt: new Date() } });
    if (step !== "TO_PICKUP") {
      await transferEvent(tx, b.requestId, step === "AT_PICKUP" ? "booking.at_pickup" : "booking.on_board", {
        userId: actor.userId,
        orgId: actor.org.id,
      });
    }
  });
}
