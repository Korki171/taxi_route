import type { TripStage, VehicleCategory } from "@prisma/client";
import { db } from "@/lib/db";
import { ROAD_FACTOR, getPlace, haversineKm, placeName } from "@/lib/places";
import { referenceOf } from "./marketplace";

/** So lange nach der Abholzeit bleibt der Link gültig. */
const LINK_HOURS_AFTER_PICKUP = 24;
/** Ältere Positionen werden nicht mehr gezeigt. */
const POSITION_MAX_AGE_MINUTES = 10;
const KMH = 70;

export type TrackPoint = { name: string; lat: number; lng: number };
export type TrackView = {
  ref: string;
  status: "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "DISPUTED" | "NO_SHOW";
  stage: TripStage | null;
  pickupAt: string;
  pickup: TrackPoint;
  dropoff: TrackPoint;
  company: string;
  phone: string | null;
  driver: string | null;
  vehicle: string | null;
  vehicleCategory: VehicleCategory | null;
  plate: string | null;
  /** Position des Fahrers, nur während der laufenden Fahrt */
  position: { lat: number; lng: number; at: string } | null;
  /** Geschätzte Minuten bis zur Abholung bzw. bis zum Ziel (Luftlinie × Straßenfaktor) */
  etaMinutes: number | null;
  at: string;
};

/**
 * Öffentliche Sicht auf eine Buchung für Auftraggeber und Fahrgast, ohne Login. Zugang nur über den
 * geheimen Schlüssel. Zeigt Strecke, Zeit, Firma, Fahrzeug und Fortschritt, aber keine Adressen, Preise
 * oder Fahrgastdaten. Die Fahrerposition gibt es nur, solange die Fahrt läuft (ab „zur Abholung“).
 */
export async function trackingView(token: string): Promise<TrackView | null> {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const b = await db.booking.findUnique({
    where: { trackToken: token },
    select: {
      status: true, tripStage: true, driverId: true, providerOrgId: true,
      request: { select: { number: true, pickupAt: true, pickupPlaceId: true, dropoffPlaceId: true } },
      providerOrg: { select: { name: true, phone: true } },
      driver: { select: { name: true } },
      vehicle: { select: { label: true, category: true, licensePlate: true } },
    },
  });
  if (!b) return null;
  const now = Date.now();
  if (now > b.request.pickupAt.getTime() + LINK_HOURS_AFTER_PICKUP * 3600_000) return null;

  const point = (id: string): TrackPoint => {
    const p = getPlace(id);
    return { name: placeName(id), lat: p?.lat ?? 0, lng: p?.lng ?? 0 };
  };
  const pickup = point(b.request.pickupPlaceId);
  const dropoff = point(b.request.dropoffPlaceId);

  let position: TrackView["position"] = null;
  let etaMinutes: number | null = null;
  if (b.status === "IN_PROGRESS" && b.tripStage && b.driverId) {
    const shift = await db.driverShift.findFirst({
      where: { userId: b.driverId, organizationId: b.providerOrgId, endedAt: null },
      orderBy: { startedAt: "desc" },
      select: { lastLat: true, lastLng: true, lastPositionAt: true },
    });
    if (shift?.lastLat != null && shift.lastLng != null && shift.lastPositionAt && now - shift.lastPositionAt.getTime() < POSITION_MAX_AGE_MINUTES * 60_000) {
      position = { lat: shift.lastLat, lng: shift.lastLng, at: shift.lastPositionAt.toISOString() };
      if (b.tripStage !== "AT_PICKUP") {
        const target = b.tripStage === "ON_BOARD" ? dropoff : pickup;
        etaMinutes = Math.max(1, Math.round(((haversineKm(position, target) * ROAD_FACTOR) / KMH) * 60));
      }
    }
  }

  return {
    ref: referenceOf(b.request.number),
    status: b.status,
    stage: b.status === "IN_PROGRESS" ? b.tripStage : null,
    pickupAt: b.request.pickupAt.toISOString(),
    pickup,
    dropoff,
    company: b.providerOrg.name,
    phone: b.providerOrg.phone,
    // Nur der Vorname des Fahrers
    driver: b.driver?.name.trim().split(/\s+/)[0] ?? null,
    vehicle: b.vehicle?.label ?? null,
    vehicleCategory: b.vehicle?.category ?? null,
    plate: b.vehicle?.licensePlate ?? null,
    position,
    etaMinutes,
    at: new Date(now).toISOString(),
  };
}
