import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission, type Actor } from "../authz/context";

const DAY = 86400_000;

/** Zeilen der Transferliste im Reisebüro-Dashboard. */
const transferInclude = {
  _count: { select: { quotes: { where: { status: "SUBMITTED" } } } },
  invitations: { select: { status: true } },
  booking: { select: { id: true, status: true, agreedPriceCents: true, driverId: true, providerOrg: { select: { name: true } } } },
} satisfies Prisma.TransferRequestInclude;

/**
 * Übersicht für Auftraggeber (Reisebüro): anstehende Transfers mit Stand, was Aufmerksamkeit braucht,
 * Kennzahlen des laufenden Monats und die häufigsten Partner.
 */
export async function agencyOverview(actor: Actor | null, opts: { q?: string; days?: number } = {}) {
  requirePermission(actor, "transfers.request");
  const orgId = actor.org.id;
  const now = new Date();
  const days = opts.days ?? 14;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const q = opts.q?.trim().slice(0, 60);
  const number = q ? Number(q.replace(/^(TR|B)-?/i, "")) : NaN;

  const [upcoming, found, monthBookings, partners, quotesWaiting] = await Promise.all([
    db.transferRequest.findMany({
      where: {
        requesterOrgId: orgId,
        status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] },
        pickupAt: { gte: new Date(now.getTime() - 6 * 3600_000), lte: new Date(now.getTime() + days * DAY) },
      },
      orderBy: { pickupAt: "asc" },
      take: 100,
      include: transferInclude,
    }),
    q
      ? db.transferRequest.findMany({
          where: {
            requesterOrgId: orgId,
            OR: [
              { clientReference: { contains: q, mode: "insensitive" } },
              ...(Number.isInteger(number) && number > 0 ? [{ number }] : []),
              { passengersContact: { some: { name: { contains: q, mode: "insensitive" } } } },
            ],
          },
          orderBy: { pickupAt: "desc" },
          take: 30,
          include: transferInclude,
        })
      : Promise.resolve(null),
    db.booking.findMany({
      where: { requesterOrgId: orgId, acceptedAt: { gte: monthStart } },
      select: { status: true, agreedPriceCents: true, request: { select: { priceCents: true, priceMode: true } } },
    }),
    db.booking.groupBy({
      by: ["providerOrgId"],
      where: { requesterOrgId: orgId, status: { in: ["CONFIRMED", "IN_PROGRESS", "COMPLETED"] } },
      _count: { _all: true },
      _sum: { agreedPriceCents: true },
      orderBy: { _count: { providerOrgId: "desc" } },
      take: 5,
    }),
    db.quote.count({ where: { status: "SUBMITTED", request: { requesterOrgId: orgId, status: "OPEN" } } }),
  ]);

  const partnerOrgs = await db.organization.findMany({
    where: { id: { in: partners.map((p) => p.providerOrgId) } },
    select: { id: true, name: true, city: true },
  });
  const byId = new Map(partnerOrgs.map((o) => [o.id, o]));

  const valid = monthBookings.filter((b) => b.status !== "CANCELLED");
  // Ersparnis gegenüber dem eigenen Richtpreis (nur verhandelte Aufträge mit Richtpreis)
  const saved = valid.reduce((s, b) => (b.request.priceMode === "NEGOTIABLE" && b.request.priceCents ? s + Math.max(0, b.request.priceCents - b.agreedPriceCents) : s), 0);

  // Was Aufmerksamkeit braucht: bald fällig und noch nicht vergeben, oder ohne jede Reaktion
  const soon = new Date(now.getTime() + 2 * DAY);
  const attention = upcoming.filter((r) => r.status === "OPEN" && (r.pickupAt <= soon || (r.quoteDeadline && r.quoteDeadline <= now)));

  return {
    upcoming,
    found,
    attention,
    quotesWaiting,
    month: {
      bookings: valid.length,
      cancelled: monthBookings.length - valid.length,
      spentCents: valid.reduce((s, b) => s + b.agreedPriceCents, 0),
      savedCents: saved,
    },
    partners: partners.map((p) => ({
      org: byId.get(p.providerOrgId) ?? { id: p.providerOrgId, name: "–", city: "" },
      trips: p._count._all,
      totalCents: p._sum.agreedPriceCents ?? 0,
    })),
  };
}

export type TransferRow = Prisma.TransferRequestGetPayload<{ include: typeof transferInclude }>;

/** Stand eines Transfers aus Sicht des Auftraggebers. */
export function transferState(r: TransferRow): { label: string; tone: "ok" | "warn" | "bad" | "neutral" } {
  if (r.booking) {
    if (r.status === "IN_PROGRESS") return { label: "Unterwegs", tone: "warn" };
    return r.booking.driverId ? { label: "Bestätigt, Fahrer eingeteilt", tone: "ok" } : { label: "Bestätigt", tone: "ok" };
  }
  if (r._count.quotes > 0) return { label: "Angebote liegen vor", tone: "warn" };
  const declined = r.invitations.filter((i) => i.status === "DECLINED").length;
  if (r.visibility === "INVITED" && r.invitations.length > 0 && declined === r.invitations.length) return { label: "Alle Angefragten haben abgelehnt", tone: "bad" };
  return { label: "Wartet auf Angebote", tone: "neutral" };
}
