import type { MemberRole } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { getPlace } from "@/lib/places";
import { requirePermission, type Actor } from "../authz/context";
import { ROLE_PERMISSIONS } from "../authz/permissions";
import { invalid, notFound } from "../errors";
import { parse } from "../validation";
import { audit } from "./audit";
import { referenceOf } from "./marketplace";

const DRIVING_ROLES = (Object.keys(ROLE_PERMISSIONS) as MemberRole[]).filter((r) => ROLE_PERMISSIONS[r].has("trips.drive"));

/** Teammitglieder, denen Fahrten zugewiesen werden können (Fahrer, aber auch fahrende Inhaber). */
export async function listDrivers(actor: Actor | null) {
  requirePermission(actor, "fleet.manage");
  const members = await db.membership.findMany({
    where: { organizationId: actor.org.id, role: { in: DRIVING_ROLES }, user: { status: "ACTIVE" } },
    include: { user: { select: { id: true, name: true } } },
  });
  // Fahrer zuerst, dann nach Name
  return members
    .map((m) => ({ id: m.user.id, name: m.user.name, role: m.role }))
    .sort((a, b) => Number(b.role === "DRIVER") - Number(a.role === "DRIVER") || a.name.localeCompare(b.name));
}

/** Laufende und anstehende Fahrten des eigenen Unternehmens für die Disposition. */
export async function listDispatchBookings(actor: Actor | null) {
  requirePermission(actor, "fleet.manage");
  return db.booking.findMany({
    where: {
      providerOrgId: actor.org.id,
      OR: [
        { status: "IN_PROGRESS" },
        { status: "CONFIRMED", request: { pickupAt: { gte: new Date(Date.now() - 12 * 3600_000) } } },
      ],
    },
    orderBy: { request: { pickupAt: "asc" } },
    take: 100,
    include: {
      request: { select: { id: true, number: true, pickupPlaceId: true, dropoffPlaceId: true, pickupAt: true, passengers: true, luggage: true, vehicleCategory: true } },
      driver: { select: { id: true, name: true } },
      vehicle: { select: { id: true, label: true } },
    },
  });
}

const assignSchema = z.object({
  driverId: z.string().optional().transform((v) => v || null),
  vehicleId: z.string().optional().transform((v) => v || null),
});

/** Disponent weist einer eigenen Buchung Fahrer und Fahrzeug zu (oder nimmt die Zuweisung zurück). */
export async function assignBooking(actor: Actor | null, bookingId: string, input: unknown) {
  requirePermission(actor, "fleet.manage");
  const data = parse(assignSchema, input);
  const b = await db.booking.findFirst({ where: { id: bookingId, providerOrgId: actor.org.id } });
  if (!b) throw notFound();
  if (b.status !== "CONFIRMED" && b.status !== "IN_PROGRESS") {
    throw invalid("Abgeschlossene oder stornierte Fahrten können nicht mehr zugewiesen werden.");
  }
  if (data.driverId) {
    const m = await db.membership.findUnique({
      where: { userId_organizationId: { userId: data.driverId, organizationId: actor.org.id } },
    });
    if (!m || !DRIVING_ROLES.includes(m.role)) throw invalid("Diese Person kann keine Fahrten übernehmen.");
  }
  if (data.vehicleId) {
    const v = await db.vehicle.findFirst({ where: { id: data.vehicleId, organizationId: actor.org.id, active: true } });
    if (!v) throw invalid("Fahrzeug nicht gefunden.");
  }
  const driverChanged = data.driverId !== b.driverId;
  await db.booking.update({
    where: { id: b.id },
    // Neuer Fahrer beginnt beim Fortschritt von vorn, eine laufende Fahrt bleibt aber „unterwegs“.
    data: { driverId: data.driverId, vehicleId: data.vehicleId, ...(driverChanged ? { tripStage: null, tripStageAt: null } : {}) },
  });
  await audit(db, {
    actorUserId: actor.userId,
    organizationId: actor.org.id,
    action: "booking.assigned",
    targetId: b.id,
    data: { driverId: data.driverId, vehicleId: data.vehicleId },
  });
}

export type LiveVehicle = {
  shiftId: string;
  driver: string;
  vehicle: string | null;
  plate: string | null;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  positionAt: string | null;
  shiftStartedAt: string;
  trail: [number, number][];
  trip: null | {
    requestId: string;
    ref: string;
    status: "CONFIRMED" | "IN_PROGRESS";
    stage: "TO_PICKUP" | "AT_PICKUP" | "ON_BOARD" | null;
    pickupAt: string;
    passengers: number;
    pickup: { name: string; address: string | null; lat: number; lng: number };
    dropoff: { name: string; address: string | null; lat: number; lng: number };
  };
};

const TRAIL_MINUTES = 30;

/**
 * Lagebild für die Live-Karte: alle Fahrer in offener Schicht mit letzter Position, Spur der
 * letzten Minuten und dem aktuellen bzw. nächsten Auftrag. Nur für das eigene Unternehmen.
 */
export async function liveFleet(actor: Actor | null): Promise<{ vehicles: LiveVehicle[]; unassigned: number; at: string }> {
  requirePermission(actor, "fleet.manage");
  const shifts = await db.driverShift.findMany({
    where: { organizationId: actor.org.id, endedAt: null },
    include: {
      user: { select: { id: true, name: true } },
      vehicle: { select: { label: true, licensePlate: true } },
      positions: {
        where: { recordedAt: { gte: new Date(Date.now() - TRAIL_MINUTES * 60_000) } },
        orderBy: { recordedAt: "asc" },
        select: { lat: true, lng: true },
        take: 400,
      },
    },
    orderBy: { startedAt: "asc" },
  });
  const driverIds = shifts.map((s) => s.userId);
  const [bookings, unassigned] = await Promise.all([
    db.booking.findMany({
      where: {
        providerOrgId: actor.org.id,
        driverId: { in: driverIds },
        OR: [
          { status: "IN_PROGRESS" },
          { status: "CONFIRMED", request: { pickupAt: { gte: new Date(Date.now() - 6 * 3600_000) } } },
        ],
      },
      orderBy: { request: { pickupAt: "asc" } },
      include: { request: true },
    }),
    db.booking.count({
      where: {
        providerOrgId: actor.org.id,
        driverId: null,
        status: "CONFIRMED",
        request: { pickupAt: { gte: new Date(Date.now() - 6 * 3600_000), lte: new Date(Date.now() + 24 * 3600_000) } },
      },
    }),
  ]);

  const vehicles = shifts.map((s): LiveVehicle => {
    const mine = bookings.filter((b) => b.driverId === s.userId);
    const b = mine.find((x) => x.status === "IN_PROGRESS") ?? mine[0];
    const place = (id: string, address: string | null) => {
      const p = getPlace(id);
      return { name: p?.name ?? id, address, lat: p?.lat ?? 0, lng: p?.lng ?? 0 };
    };
    return {
      shiftId: s.id,
      driver: s.user.name,
      vehicle: s.vehicle?.label ?? null,
      plate: s.vehicle?.licensePlate ?? null,
      lat: s.lastLat,
      lng: s.lastLng,
      accuracy: s.lastAccuracy,
      speed: s.lastSpeed,
      heading: s.lastHeading,
      positionAt: s.lastPositionAt?.toISOString() ?? null,
      shiftStartedAt: s.startedAt.toISOString(),
      trail: s.positions.map((p) => [p.lat, p.lng]),
      trip: b
        ? {
            requestId: b.requestId,
            ref: referenceOf(b.request.number),
            status: b.status as "CONFIRMED" | "IN_PROGRESS",
            stage: b.tripStage,
            pickupAt: b.request.pickupAt.toISOString(),
            passengers: b.request.passengers,
            pickup: place(b.request.pickupPlaceId, b.request.pickupAddress),
            dropoff: place(b.request.dropoffPlaceId, b.request.dropoffAddress),
          }
        : null,
    };
  });
  return { vehicles, unassigned, at: new Date().toISOString() };
}
