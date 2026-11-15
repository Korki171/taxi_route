import { z } from "zod";
import { db } from "@/lib/db";
import { actorCan, requirePermission, type Actor } from "../authz/context";
import { conflict, forbidden, invalid, notFound } from "../errors";
import { transferEvent } from "./transfer-events";

export type RatingSummary = { avg: number; count: number };

const ratingSchema = z.object({
  stars: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(300).optional(),
});

/**
 * Bewertung nach der Fahrt. Jede der beiden beteiligten Firmen bewertet die andere genau einmal je
 * durchgeführter Buchung mit 1 bis 5 Sternen und einem kurzen Kommentar. Eigene Fahrten („Selbst fahren“)
 * lassen sich nicht bewerten.
 */
export async function rateBooking(actor: Actor | null, bookingId: string, input: unknown) {
  requirePermission(actor, "org.read");
  if (!actorCan(actor, "bookings.manage") && !actorCan(actor, "jobs.accept")) throw forbidden();
  const parsed = ratingSchema.safeParse(input);
  if (!parsed.success) throw invalid("Bitte 1 bis 5 Sterne wählen.");
  const b = await db.booking.findFirst({
    where: { id: bookingId, OR: [{ providerOrgId: actor.org.id }, { requesterOrgId: actor.org.id }] },
    select: { id: true, requestId: true, status: true, providerOrgId: true, requesterOrgId: true },
  });
  if (!b) throw notFound();
  if (b.status !== "COMPLETED") throw invalid("Bewerten können Sie erst nach der durchgeführten Fahrt.");
  if (b.providerOrgId === b.requesterOrgId) throw invalid("Eigene Fahrten lassen sich nicht bewerten.");
  const toOrgId = b.providerOrgId === actor.org.id ? b.requesterOrgId : b.providerOrgId;
  if (await db.rating.count({ where: { bookingId: b.id, fromOrgId: actor.org.id } })) throw conflict("Sie haben diese Fahrt bereits bewertet.");
  const rating = await db.rating.create({
    data: { bookingId: b.id, fromOrgId: actor.org.id, toOrgId, createdBy: actor.userId, stars: parsed.data.stars, comment: parsed.data.comment || null },
  });
  await transferEvent(db, b.requestId, "booking.rated", { userId: actor.userId, orgId: actor.org.id }, { stars: rating.stars });
  return rating;
}

/** Bewertungen zu einer Buchung, nur für die beiden beteiligten Firmen. */
export async function listBookingRatings(actor: Actor | null, bookingId: string) {
  requirePermission(actor, "org.read");
  return db.rating.findMany({
    where: { bookingId, booking: { OR: [{ providerOrgId: actor.org.id }, { requesterOrgId: actor.org.id }] } },
    select: { id: true, fromOrgId: true, toOrgId: true, stars: true, comment: true, createdAt: true },
  });
}

/** Schnitt und Anzahl der erhaltenen Bewertungen je Firma. Firmen ohne Bewertung fehlen in der Map. */
export async function ratingSummaries(orgIds: string[]): Promise<Map<string, RatingSummary>> {
  const ids = [...new Set(orgIds)];
  if (ids.length === 0) return new Map();
  const rows = await db.rating.groupBy({ by: ["toOrgId"], where: { toOrgId: { in: ids } }, _avg: { stars: true }, _count: { _all: true } });
  return new Map(rows.map((r) => [r.toOrgId, { avg: r._avg.stars ?? 0, count: r._count._all }]));
}
