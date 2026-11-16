import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { RATING_WINDOW_DAYS } from "@/lib/rating-rules";
import { checkText, TEXT_CHECK_MESSAGE } from "@/lib/text-filter";
import { actorCan, requirePermission, requirePlatformAdmin, type Actor } from "../authz/context";
import { conflict, forbidden, invalid, notFound } from "../errors";
import { audit } from "./audit";
import { transferEvent } from "./transfer-events";

const WINDOW_MS = RATING_WINDOW_DAYS * 24 * 3600_000;

export type RatingSummary = { avg: number; count: number; rides: number };

const score = z.coerce.number().int().min(1).max(5);
const textSchema = z.string().trim().max(300).optional();

function checked(text: string | undefined): string | null {
  const t = text?.trim();
  if (!t) return null;
  const res = checkText(t);
  if (!res.ok) throw invalid(TEXT_CHECK_MESSAGE[res.reason]);
  return t;
}

/** Bis wann eine Buchung bewertet werden kann. */
export function ratingDeadline(b: { completedAt: Date | null; acceptedAt: Date }): Date {
  return new Date((b.completedAt ?? b.acceptedAt).getTime() + WINDOW_MS);
}

/** Bewertungen, die alle sehen dürfen: beide haben bewertet, oder die Frist ist vorbei. */
function visibleWhere(now = new Date()): Prisma.RatingWhereInput {
  return { OR: [{ revealedAt: { not: null } }, { booking: { completedAt: { lt: new Date(now.getTime() - WINDOW_MS) } } }] };
}

function isVisible(r: { revealedAt: Date | null }, deadline: Date, now = new Date()) {
  return r.revealedAt != null || now > deadline;
}

/**
 * Bewertung nach der durchgeführten Fahrt. Jede der beiden Firmen bewertet die andere genau einmal je
 * Buchung, bis 104 Tage nach dem Abschluss, in drei Kategorien je Rolle und mit optionalem Kommentar.
 * Sobald beide bewertet haben, werden beide Bewertungen sichtbar. Eigene Fahrten lassen sich nicht bewerten.
 */
export async function rateBooking(actor: Actor | null, bookingId: string, input: unknown) {
  requirePermission(actor, "org.read");
  if (!actorCan(actor, "bookings.manage") && !actorCan(actor, "jobs.accept")) throw forbidden();
  const b = await db.booking.findFirst({
    where: { id: bookingId, OR: [{ providerOrgId: actor.org.id }, { requesterOrgId: actor.org.id }] },
    select: { id: true, requestId: true, status: true, providerOrgId: true, requesterOrgId: true, completedAt: true, acceptedAt: true },
  });
  if (!b) throw notFound();
  if (b.status !== "COMPLETED") throw invalid("Bewerten können Sie erst nach der durchgeführten Fahrt.");
  if (b.providerOrgId === b.requesterOrgId) throw invalid("Eigene Fahrten lassen sich nicht bewerten.");
  if (new Date() > ratingDeadline(b)) throw invalid("Die Frist für die Bewertung ist abgelaufen.");

  const role = b.requesterOrgId === actor.org.id ? "requester" : "provider";
  const parsed = (role === "requester"
    ? z.object({ communication: score, punctuality: score, passengerCare: score, comment: textSchema })
    : z.object({ communication: score, fairness: score, payment: score, comment: textSchema })
  ).safeParse(input);
  if (!parsed.success) throw invalid("Bitte jede Kategorie mit 1 bis 5 Sternen bewerten.");
  const { comment: rawComment, ...scores } = parsed.data;
  const comment = checked(rawComment);
  const values = Object.values(scores);
  const stars = Math.round((values.reduce((a, c) => a + c, 0) / values.length) * 100) / 100;
  const toOrgId = role === "requester" ? b.providerOrgId : b.requesterOrgId;

  return db.$transaction(async (tx) => {
    // Sperre auf der Buchung: zwei gleichzeitige Bewertungen sollen das Aufdecken nicht verpassen
    await tx.$queryRaw`SELECT id FROM "Booking" WHERE id = ${b.id} FOR UPDATE`;
    if (await tx.rating.count({ where: { bookingId: b.id, fromOrgId: actor.org.id } })) throw conflict("Sie haben diese Fahrt bereits bewertet.");
    const other = await tx.rating.findFirst({ where: { bookingId: b.id, fromOrgId: toOrgId }, select: { id: true } });
    const now = new Date();
    const rating = await tx.rating.create({
      data: { bookingId: b.id, fromOrgId: actor.org.id, toOrgId, createdBy: actor.userId, stars, ...scores, comment, revealedAt: other ? now : null },
    });
    if (other) await tx.rating.update({ where: { id: other.id }, data: { revealedAt: now } });
    await transferEvent(tx, b.requestId, "booking.rated", { userId: actor.userId, orgId: actor.org.id });
    return rating;
  });
}

/**
 * Bewertungen zu einer Buchung, nur für die beiden beteiligten Firmen. Die eigene Bewertung sieht man immer,
 * die der anderen Seite erst, wenn sie sichtbar ist. Ausgeblendete Kommentare und Antworten fehlen.
 */
export async function listBookingRatings(actor: Actor | null, bookingId: string) {
  requirePermission(actor, "org.read");
  const b = await db.booking.findFirst({
    where: { id: bookingId, OR: [{ providerOrgId: actor.org.id }, { requesterOrgId: actor.org.id }] },
    select: { completedAt: true, acceptedAt: true },
  });
  if (!b) return [];
  const deadline = ratingDeadline(b);
  const rows = await db.rating.findMany({
    where: { bookingId },
    select: {
      id: true, fromOrgId: true, toOrgId: true, stars: true, communication: true, punctuality: true, passengerCare: true,
      fairness: true, payment: true, comment: true, reply: true, replyAt: true, revealedAt: true, commentHiddenAt: true, createdAt: true,
      reports: { where: { orgId: actor.org.id }, select: { id: true } },
    },
  });
  return rows
    .map(({ reports, ...r }) => ({
      ...r,
      visible: isVisible(r, deadline),
      reportedByMe: reports.length > 0,
      comment: r.commentHiddenAt ? null : r.comment,
      reply: r.commentHiddenAt ? null : r.reply,
    }))
    .filter((r) => r.fromOrgId === actor.org.id || r.visible);
}

/** Eine Antwort der bewerteten Firma, sobald die Bewertung sichtbar ist. Nur die beiden Firmen sehen sie. */
export async function replyToRating(actor: Actor | null, ratingId: string, text: string) {
  requirePermission(actor, "org.read");
  if (!actorCan(actor, "bookings.manage") && !actorCan(actor, "jobs.accept")) throw forbidden();
  const r = await db.rating.findFirst({
    where: { id: ratingId, toOrgId: actor.org.id },
    select: { id: true, reply: true, revealedAt: true, booking: { select: { completedAt: true, acceptedAt: true } } },
  });
  if (!r) throw notFound();
  if (!isVisible(r, ratingDeadline(r.booking))) throw invalid("Antworten können Sie, sobald die Bewertung sichtbar ist.");
  const reply = checked(z.string().max(300).parse(text));
  if (!reply) throw invalid("Bitte eine Antwort eingeben.");
  const res = await db.rating.updateMany({ where: { id: r.id, reply: null }, data: { reply, replyAt: new Date() } });
  if (res.count !== 1) throw conflict("Sie haben auf diese Bewertung bereits geantwortet.");
}

/** Kommentar oder Antwort an die Admins melden. Melden können beide beteiligten Firmen, je einmal. */
export async function reportRating(actor: Actor | null, ratingId: string, reason?: string) {
  requirePermission(actor, "org.read");
  if (!actorCan(actor, "bookings.manage") && !actorCan(actor, "jobs.accept")) throw forbidden();
  const r = await db.rating.findFirst({
    where: { id: ratingId, OR: [{ toOrgId: actor.org.id }, { fromOrgId: actor.org.id }] },
    select: { id: true },
  });
  if (!r) throw notFound();
  const exists = await db.ratingReport.findUnique({ where: { ratingId_orgId: { ratingId: r.id, orgId: actor.org.id } } });
  if (exists) throw conflict("Sie haben diese Bewertung bereits gemeldet.");
  await db.ratingReport.create({
    data: { ratingId: r.id, orgId: actor.org.id, userId: actor.userId, reason: reason?.trim().slice(0, 500) || null },
  });
}

/**
 * Schnitt und Anzahl der sichtbaren Bewertungen sowie die Zahl der durchgeführten Fahrten je Firma.
 * Jede angefragte Firma ist in der Map. Den Schnitt zeigen die Seiten erst ab `RATING_MIN_PUBLIC` Bewertungen.
 */
export async function ratingSummaries(orgIds: string[]): Promise<Map<string, RatingSummary>> {
  const ids = [...new Set(orgIds)];
  if (ids.length === 0) return new Map();
  const [rows, asProvider, asRequester] = await Promise.all([
    db.rating.groupBy({ by: ["toOrgId"], where: { toOrgId: { in: ids }, ...visibleWhere() }, _avg: { stars: true }, _count: { _all: true } }),
    db.booking.groupBy({ by: ["providerOrgId"], where: { providerOrgId: { in: ids }, status: "COMPLETED" }, _count: { _all: true } }),
    db.booking.groupBy({ by: ["requesterOrgId"], where: { requesterOrgId: { in: ids }, status: "COMPLETED" }, _count: { _all: true } }),
  ]);
  const map = new Map<string, RatingSummary>(ids.map((id) => [id, { avg: 0, count: 0, rides: 0 }]));
  for (const r of rows) Object.assign(map.get(r.toOrgId)!, { avg: r._avg.stars ?? 0, count: r._count._all });
  for (const r of asProvider) map.get(r.providerOrgId)!.rides += r._count._all;
  for (const r of asRequester) map.get(r.requesterOrgId)!.rides += r._count._all;
  return map;
}

// ---------------------------------------------------------------------------
// Admin: gemeldete Kommentare
// ---------------------------------------------------------------------------

export async function adminListRatingReports(actor: Actor | null) {
  requirePlatformAdmin(actor);
  return db.ratingReport.findMany({
    where: { resolvedAt: null },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true, reason: true, createdAt: true, orgId: true,
      rating: { select: { id: true, stars: true, comment: true, reply: true, commentHiddenAt: true, fromOrgId: true, toOrgId: true, toOrg: { select: { name: true } }, booking: { select: { requestId: true } } } },
    },
  });
}

/** Meldung erledigen: Kommentar und Antwort ausblenden (die Sterne zählen weiter) oder die Meldung ablehnen. */
export async function adminResolveRatingReport(actor: Actor | null, reportId: string, hide: boolean) {
  requirePlatformAdmin(actor);
  const rep = await db.ratingReport.findUnique({ where: { id: reportId }, select: { id: true, ratingId: true, resolvedAt: true } });
  if (!rep) throw notFound();
  const now = new Date();
  await db.$transaction(async (tx) => {
    if (hide) await tx.rating.update({ where: { id: rep.ratingId }, data: { commentHiddenAt: now, commentHiddenBy: actor.userId } });
    // Mit dem Ausblenden sind alle offenen Meldungen zu dieser Bewertung erledigt
    await tx.ratingReport.updateMany({
      where: hide ? { ratingId: rep.ratingId, resolvedAt: null } : { id: rep.id },
      data: { resolvedAt: now, resolvedBy: actor.userId },
    });
    await audit(tx, { actorUserId: actor.userId, action: hide ? "rating.comment_hidden" : "rating.report_dismissed", targetType: "Rating", targetId: rep.ratingId });
  });
}
