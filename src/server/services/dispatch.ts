import type { MemberRole } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { getPlace, haversineKm, nearestPlace, ROAD_FACTOR } from "@/lib/places";
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

export type LivePoint = { name: string; address: string | null; lat: number; lng: number };

/**
 * Aktuelle Etappe eines Fahrzeugs: woher es kommt, wohin es fährt und wie weit es ist.
 * Kilometer und Minuten sind Schätzungen (Luftlinie × Straßenfaktor), bis ein Routingdienst angebunden ist.
 */
export type LiveLeg = {
  /** to-pickup: leer zur Abholung, to-dropoff: mit Fahrgast zum Ziel, waiting: am Abholort, planned: Fahrt steht noch an */
  kind: "to-pickup" | "to-dropoff" | "waiting" | "planned";
  start: LivePoint;
  end: LivePoint;
  since: string | null;
  drivenKm: number;
  remainingKm: number;
  etaMinutes: number;
  /** 0–100 */
  progress: number;
};

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
  /** Gefahrene Strecke der laufenden Etappe, ohne Etappe die letzten 30 Minuten */
  trail: [number, number][];
  leg: LiveLeg | null;
  trip: null | {
    requestId: string;
    ref: string;
    status: "CONFIRMED" | "IN_PROGRESS";
    stage: "TO_PICKUP" | "AT_PICKUP" | "ON_BOARD" | null;
    pickupAt: string;
    passengers: number;
    pickup: LivePoint;
    dropoff: LivePoint;
  };
};

const TRAIL_MINUTES = 30;
/** Längste Etappe, deren Spur gezeichnet wird (München und zurück passt hinein). */
const LEG_MAX_HOURS = 6;
const TRAIL_MAX_POINTS = 300;
const DEFAULT_KMH = 60;

function pathKm(path: [number, number][]) {
  let km = 0;
  for (let i = 1; i < path.length; i++) {
    km += haversineKm({ lat: path[i - 1][0], lng: path[i - 1][1] }, { lat: path[i][0], lng: path[i][1] });
  }
  return km;
}

/** Jeden n-ten Punkt behalten, damit lange Fahrten die Antwort nicht aufblähen; Anfang und Ende bleiben. */
function thin(path: [number, number][]) {
  if (path.length <= TRAIL_MAX_POINTS) return path;
  const step = path.length / (TRAIL_MAX_POINTS - 1);
  const out: [number, number][] = [];
  for (let i = 0; i < TRAIL_MAX_POINTS - 1; i++) out.push(path[Math.floor(i * step)]);
  out.push(path[path.length - 1]);
  return out;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Lagebild für die Live-Karte: alle Fahrer in offener Schicht mit letzter Position, der gefahrenen
 * Strecke und dem aktuellen bzw. nächsten Auftrag samt Etappe. Nur für das eigene Unternehmen.
 */
export async function liveFleet(actor: Actor | null): Promise<{ vehicles: LiveVehicle[]; unassigned: number; at: string }> {
  requirePermission(actor, "fleet.manage");
  const now = Date.now();
  const shifts = await db.driverShift.findMany({
    where: { organizationId: actor.org.id, endedAt: null },
    include: {
      user: { select: { id: true, name: true } },
      vehicle: { select: { label: true, licensePlate: true } },
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
          { status: "CONFIRMED", request: { pickupAt: { gte: new Date(now - 6 * 3600_000) } } },
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
        request: { pickupAt: { gte: new Date(now - 6 * 3600_000), lte: new Date(now + 24 * 3600_000) } },
      },
    }),
  ]);

  const place = (id: string, address: string | null): LivePoint => {
    const p = getPlace(id);
    return { name: p?.name ?? id, address, lat: p?.lat ?? 0, lng: p?.lng ?? 0 };
  };

  const vehicles: LiveVehicle[] = [];
  for (const s of shifts) {
    const mine = bookings.filter((b) => b.driverId === s.userId);
    const b = mine.find((x) => x.status === "IN_PROGRESS") ?? mine[0];
    const trip: LiveVehicle["trip"] = b
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
      : null;

    // Etappe beginnt mit dem letzten Statuswechsel des Fahrers („Losfahren“, „Fahrgast an Bord“).
    const stage = trip?.stage ?? null;
    const legStart = stage && b?.tripStageAt && now - b.tripStageAt.getTime() < LEG_MAX_HOURS * 3600_000 ? b.tripStageAt : null;
    const since = new Date(Math.max(legStart?.getTime() ?? now - TRAIL_MINUTES * 60_000, s.startedAt.getTime() - 60_000));
    const positions = await db.positionPing.findMany({
      where: { shiftId: s.id, recordedAt: { gte: since } },
      orderBy: { recordedAt: "asc" },
      select: { lat: true, lng: true },
      take: 5000,
    });
    const trail = positions.map((p): [number, number] => [p.lat, p.lng]);

    let leg: LiveLeg | null = null;
    const here = s.lastLat != null && s.lastLng != null ? { lat: s.lastLat, lng: s.lastLng } : null;
    if (trip && here) {
      const first = trail[0] ? { lat: trail[0][0], lng: trail[0][1] } : here;
      const near = nearestPlace(first);
      const [kind, start, end]: [LiveLeg["kind"], LivePoint, LivePoint] =
        stage === "ON_BOARD" ? ["to-dropoff", { ...trip.pickup }, { ...trip.dropoff }]
        : stage === "AT_PICKUP" ? ["waiting", { ...trip.pickup }, { ...trip.dropoff }]
        : stage === "TO_PICKUP" ? ["to-pickup", { name: near.name, address: null, ...first }, { ...trip.pickup }]
        : ["planned", { name: nearestPlace(here).name, address: null, ...here }, { ...trip.pickup }];
      const moving = kind === "to-pickup" || kind === "to-dropoff";
      const drivenKm = moving ? pathKm(trail) : 0;
      const remainingKm = (kind === "waiting" ? haversineKm(start, end) : haversineKm(here, end)) * ROAD_FACTOR;
      // Tempo aus der bisherigen Etappe, sonst ein vorsichtiger Durchschnitt
      const hours = legStart ? (now - legStart.getTime()) / 3600_000 : 0;
      const kmh = moving && hours > 0.08 && drivenKm > 1 ? Math.min(100, Math.max(30, drivenKm / hours)) : DEFAULT_KMH;
      leg = {
        kind,
        start,
        end,
        since: legStart?.toISOString() ?? null,
        drivenKm: round1(drivenKm),
        remainingKm: round1(remainingKm),
        etaMinutes: Math.max(1, Math.round((remainingKm / kmh) * 60)),
        progress: moving && drivenKm + remainingKm > 0 ? Math.round((drivenKm / (drivenKm + remainingKm)) * 100) : 0,
      };
    }

    vehicles.push({
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
      trail: thin(trail),
      leg,
      trip,
    });
  }
  return { vehicles, unassigned, at: new Date(now).toISOString() };
}

/** Ortsnamen für die Anzeige übersetzen (Seite und API). */
export function translateLive<T extends { vehicles: LiveVehicle[] }>(data: T, t: (s: string) => string): T {
  for (const v of data.vehicles) {
    for (const p of [v.trip?.pickup, v.trip?.dropoff, v.leg?.start, v.leg?.end]) if (p) p.name = t(p.name);
  }
  return data;
}
