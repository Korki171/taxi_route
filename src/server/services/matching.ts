import type { CapacityOffer, VehicleCategory } from "@prisma/client";
import { db } from "@/lib/db";
import { estimateMinutes } from "@/lib/places";
import { requirePermission, type Actor } from "../authz/context";
import { notFound } from "../errors";
import { VISIBLE_TO } from "./visibility";

/** Größere Fahrzeuge können Aufträge für kleinere Kategorien übernehmen; Sonderfahrzeuge nur ihre eigene. */
const SIZE_ORDER: VehicleCategory[] = ["SEDAN", "ESTATE", "MINIVAN", "VAN", "MINIBUS", "BUS"];

export function categoryFits(offered: VehicleCategory, wanted: VehicleCategory | null): boolean {
  if (!wanted) return true;
  if (offered === wanted) return true;
  const a = SIZE_ORDER.indexOf(offered);
  const b = SIZE_ORDER.indexOf(wanted);
  return a >= 0 && b >= 0 && a >= b;
}

export type MatchInput = Pick<
  CapacityOffer,
  "fromPlaceId" | "toPlaceId" | "availableFrom" | "availableUntil" | "seats" | "luggage" | "maxDetourMinutes" | "maxWaitMinutes" | "vehicleCategory"
>;

export type RequestForMatch = {
  pickupPlaceId: string;
  dropoffPlaceId: string;
  pickupAt: Date;
  pickupWindowMinutes: number;
  passengers: number;
  luggage: number;
  vehicleCategory: VehicleCategory | null;
};

export type MatchResult =
  | { fits: true; detourMinutes: number; waitMinutes: number; arrivalAtPickup: Date }
  | { fits: false; reason: string };

/**
 * Prüft, ob eine geplante Fahrt A → B einen Auftrag P → D mitnehmen kann (A → P → D → B).
 * Fahrzeiten sind Schätzungen aus dem Ortskatalog (Luftlinie × Straßenfaktor).
 */
export function matchCapacity(offer: MatchInput, req: RequestForMatch): MatchResult {
  if (req.passengers > offer.seats) return { fits: false, reason: "zu wenige Plätze" };
  if (req.luggage > offer.luggage) return { fits: false, reason: "zu wenig Gepäckraum" };
  if (!categoryFits(offer.vehicleCategory, req.vehicleCategory)) return { fits: false, reason: "Fahrzeugkategorie passt nicht" };

  const direct = estimateMinutes(offer.fromPlaceId, offer.toPlaceId);
  const toPickup = estimateMinutes(offer.fromPlaceId, req.pickupPlaceId);
  const trip = estimateMinutes(req.pickupPlaceId, req.dropoffPlaceId);
  const toEnd = estimateMinutes(req.dropoffPlaceId, offer.toPlaceId);
  const detour = Math.max(0, toPickup + trip + toEnd - direct);
  if (detour > offer.maxDetourMinutes) return { fits: false, reason: `Umweg ca. ${detour} min` };

  const arrival = new Date(offer.availableFrom.getTime() + toPickup * 60_000);
  const latestPickup = new Date(req.pickupAt.getTime() + req.pickupWindowMinutes * 60_000);
  if (arrival > latestPickup) return { fits: false, reason: "Fahrzeug kommt zu spät" };
  if (req.pickupAt > offer.availableUntil) return { fits: false, reason: "außerhalb des Zeitfensters" };
  const earliestPickup = new Date(req.pickupAt.getTime() - req.pickupWindowMinutes * 60_000);
  const wait = Math.max(0, Math.round((earliestPickup.getTime() - arrival.getTime()) / 60_000));
  if (wait > offer.maxWaitMinutes) return { fits: false, reason: `Wartezeit ca. ${wait} min` };

  return { fits: true, detourMinutes: detour, waitMinutes: wait, arrivalAtPickup: arrival };
}

/** Offene Aufträge anderer Organisationen, die zu einer eigenen Kapazität passen (Szenario C). */
export async function findMatchesForCapacity(actor: Actor | null, offerId: string) {
  requirePermission(actor, "jobs.accept");
  const offer = await db.capacityOffer.findFirst({ where: { id: offerId, organizationId: actor.org.id } });
  if (!offer) throw notFound();
  const now = new Date();
  const candidates = await db.transferRequest.findMany({
    where: {
      status: "OPEN",
      requesterOrgId: { not: actor.org.id },
      requesterOrg: { status: "ACTIVE" },
      pickupAt: { gte: new Date(offer.availableFrom.getTime() - 4 * 3600_000), lte: offer.availableUntil, gt: now },
      passengers: { lte: offer.seats },
      luggage: { lte: offer.luggage },
      AND: [{ OR: [{ quoteDeadline: null }, { quoteDeadline: { gt: now } }] }, VISIBLE_TO(actor.org.id)],
    },
    orderBy: { pickupAt: "asc" },
    take: 200,
    select: {
      id: true, number: true, pickupPlaceId: true, dropoffPlaceId: true, pickupAt: true, pickupWindowMinutes: true,
      passengers: true, luggage: true, skiEquipment: true, vehicleCategory: true, priceMode: true, priceCents: true,
      requesterOrg: { select: { name: true } },
    },
  });
  return candidates
    .map((r) => ({ request: r, match: matchCapacity(offer, r) }))
    .filter((m): m is { request: typeof m.request; match: Extract<MatchResult, { fits: true }> } => m.match.fits)
    .sort((a, b) => a.match.detourMinutes - b.match.detourMinutes);
}

/** Für alle eigenen aktiven Kapazitäten: wie viele Aufträge passen? */
export async function listCapacityWithMatches(actor: Actor | null) {
  requirePermission(actor, "capacity.publish");
  const offers = await db.capacityOffer.findMany({
    where: { organizationId: actor.org.id, status: { in: ["PLANNED", "CONFIRMED"] }, availableUntil: { gt: new Date() } },
    orderBy: { availableFrom: "asc" },
    include: { vehicle: { select: { label: true } } },
  });
  const result = [];
  for (const o of offers) {
    const matches = await findMatchesForCapacity(actor, o.id);
    result.push({ offer: o, matches });
  }
  return result;
}
