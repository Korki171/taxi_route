import { db } from "@/lib/db";
import { requirePermission, type Actor } from "../authz/context";

/** Wählbare Zeiträume der Auswertung in Tagen. */
export const STAT_PERIODS = [30, 90, 365] as const;

export type RouteStat = { pickupPlaceId: string; dropoffPlaceId: string; trips: number; avgPriceCents: number };

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

/**
 * Auswertung für das eigene Unternehmen: was über die Börse abgegeben und übernommen wurde.
 * Gezählt wird nach Abholzeit im Zeitraum; Umsatz nur aus abgeschlossenen Fahrten.
 */
export async function orgStats(actor: Actor | null, days: number = 90, now = new Date()) {
  requirePermission(actor, "org.read");
  const period = (STAT_PERIODS as readonly number[]).includes(days) ? days : 90;
  const since = new Date(now.getTime() - period * 86_400_000);
  const orgId = actor.org.id;

  const [posted, bookings] = await Promise.all([
    db.transferRequest.findMany({
      where: { requesterOrgId: orgId, createdAt: { gte: since, lte: now } },
      select: { createdAt: true, booking: { select: { acceptedAt: true, providerOrgId: true } } },
    }),
    db.booking.findMany({
      where: { OR: [{ providerOrgId: orgId }, { requesterOrgId: orgId }], request: { pickupAt: { gte: since, lte: now } } },
      select: {
        status: true, providerOrgId: true, requesterOrgId: true, agreedPriceCents: true, handoffShareCents: true,
        request: { select: { pickupPlaceId: true, dropoffPlaceId: true } },
      },
    }),
  ]);

  // Abgegeben: eigene Aufträge, die ein anderes Unternehmen übernommen hat
  const givenAway = posted.filter((r) => r.booking && r.booking.providerOrgId !== orgId);
  const takeMinutes = median(givenAway.map((r) => Math.round((r.booking!.acceptedAt.getTime() - r.createdAt.getTime()) / 60_000)));

  const done = bookings.filter((b) => b.status === "COMPLETED");
  const taken = done.filter((b) => b.providerOrgId === orgId && b.requesterOrgId !== orgId);
  const handed = done.filter((b) => b.requesterOrgId === orgId && b.providerOrgId !== orgId);
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

  const routes = new Map<string, { pickupPlaceId: string; dropoffPlaceId: string; trips: number; total: number }>();
  for (const b of done) {
    const key = `${b.request.pickupPlaceId}>${b.request.dropoffPlaceId}`;
    const r = routes.get(key) ?? { pickupPlaceId: b.request.pickupPlaceId, dropoffPlaceId: b.request.dropoffPlaceId, trips: 0, total: 0 };
    r.trips++;
    r.total += b.agreedPriceCents;
    routes.set(key, r);
  }
  const topRoutes: RouteStat[] = [...routes.values()]
    .sort((a, b) => b.trips - a.trips || b.total - a.total)
    .slice(0, 5)
    .map((r) => ({ pickupPlaceId: r.pickupPlaceId, dropoffPlaceId: r.dropoffPlaceId, trips: r.trips, avgPriceCents: Math.round(r.total / r.trips) }));

  return {
    days: period,
    posted: posted.length,
    givenAway: givenAway.length,
    /** Anteil der eingestellten Aufträge, die jemand übernommen hat (0–100), null ohne Aufträge */
    takenRate: posted.length ? Math.round((posted.filter((r) => r.booking).length / posted.length) * 100) : null,
    medianTakeMinutes: takeMinutes,
    takenTrips: taken.length,
    /** Was das eigene Unternehmen für übernommene Fahrten erhält (Preis minus Abgabe-Anteil) */
    takenRevenueCents: sum(taken.map((b) => b.agreedPriceCents - b.handoffShareCents)),
    handedTrips: handed.length,
    /** Abgabe-Anteil, der beim eigenen Unternehmen bleibt */
    handedShareCents: sum(handed.map((b) => b.handoffShareCents)),
    cancelled: bookings.filter((b) => b.status === "CANCELLED" || b.status === "NO_SHOW").length,
    topRoutes,
  };
}
