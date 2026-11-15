import { z } from "zod";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { makeT } from "@/lib/i18n";
import { formatCents } from "@/lib/money";
import { isPlaceId, placeName } from "@/lib/places";
import { actorCan, requirePermission, type Actor } from "../authz/context";
import { appUrl, sendAll, type Email } from "../email";
import { invalid, notFound } from "../errors";
import { parse } from "../validation";
import { notificationFailed } from "../notifications";

/**
 * Ausschreibungen für Saison- und Gruppentransfers. Ein Auftraggeber schreibt viele Fahrten auf einer
 * Strecke für einen Zeitraum aus, geprüfte Betriebe bieten einen festen Preis je Fahrt, einer erhält den
 * Zuschlag. Die einzelnen Fahrten stellt der Auftraggeber danach als gezielte Aufträge an diesen Betrieb ein.
 */

const DEFAULT_BID_DAYS = 7;
const END_OF_DAY_MS = 22 * 3600_000 - 60_000;

export function tenderReference(number: number) {
  return `AS-${String(number).padStart(5, "0")}`;
}

const empty = (v: unknown) => (v === "" || v == null ? undefined : v);
const tenderSchema = z
  .object({
    pickupPlaceId: z.string().refine(isPlaceId, "Unbekannter Abholort"),
    dropoffPlaceId: z.string().refine(isPlaceId, "Unbekannter Zielort"),
    bothDirections: z.preprocess((v) => v === true || v === "on" || v === "1", z.boolean()),
    dateFrom: z.coerce.date(),
    dateTo: z.coerce.date(),
    estimatedTrips: z.coerce.number().int().min(2, "Eine Ausschreibung braucht mindestens 2 Fahrten").max(5000),
    passengers: z.preprocess(empty, z.coerce.number().int().min(1).max(60).optional()),
    vehicleCategory: z.preprocess(empty, z.enum(["SEDAN", "ESTATE", "MINIVAN", "VAN", "MINIBUS", "BUS", "LUXURY", "WHEELCHAIR"]).optional()),
    notes: z.preprocess(empty, z.string().trim().max(1000).optional()),
    bidDeadline: z.preprocess(empty, z.coerce.date().optional()),
  })
  .refine((d) => d.pickupPlaceId !== d.dropoffPlaceId, { message: "Abhol- und Zielort müssen sich unterscheiden", path: ["dropoffPlaceId"] })
  .refine((d) => d.dateTo >= d.dateFrom, { message: "Das Ende des Zeitraums liegt vor dem Beginn", path: ["dateTo"] });

const bidSchema = z.object({
  pricePerTripCents: z.coerce.number().int().min(100).max(10_000_00),
  message: z.preprocess(empty, z.string().trim().max(500).optional()),
});

const orgSelect = { id: true, name: true, city: true, email: true, phone: true, country: true } as const;

export async function createTender(actor: Actor | null, input: unknown) {
  requirePermission(actor, "transfers.request");
  const d = parse(tenderSchema, input);
  const now = new Date();
  // Zeitraum endet am Abend des gewählten Tages (21:59 UTC ist in Mitteleuropa immer noch derselbe Tag)
  const dateTo = new Date(d.dateTo.getTime() + END_OF_DAY_MS);
  if (dateTo <= now) throw invalid("Der Zeitraum liegt in der Vergangenheit.");
  const bidDeadline = d.bidDeadline ? new Date(d.bidDeadline.getTime() + END_OF_DAY_MS) : new Date(Math.min(now.getTime() + DEFAULT_BID_DAYS * 86_400_000, dateTo.getTime()));
  if (bidDeadline <= now) throw invalid("Die Angebotsfrist liegt in der Vergangenheit.");
  const tender = await db.tender.create({
    data: {
      requesterOrgId: actor.org.id, createdById: actor.userId,
      pickupPlaceId: d.pickupPlaceId, dropoffPlaceId: d.dropoffPlaceId, bothDirections: d.bothDirections,
      dateFrom: d.dateFrom, dateTo, estimatedTrips: d.estimatedTrips,
      passengers: d.passengers ?? null, vehicleCategory: d.vehicleCategory ?? null, notes: d.notes ?? null, bidDeadline,
    },
  });
  await notifyTenderCreated(tender.id).catch(notificationFailed);
  return tender;
}

/** Wer die Ausschreibung sehen darf: geprüfte Betriebe, die der Auftraggeber nicht gesperrt hat. */
const visibleTo = (orgId: string) => ({ requesterOrgId: { not: orgId }, requesterOrg: { status: "ACTIVE" as const, blocks: { none: { blockedOrgId: orgId } } } });

/** Offene Ausschreibungen anderer Unternehmen, mit dem eigenen Angebot. */
export async function listOpenTenders(actor: Actor | null) {
  requirePermission(actor, "jobs.accept");
  return db.tender.findMany({
    where: { status: "OPEN", bidDeadline: { gt: new Date() }, ...visibleTo(actor.org.id) },
    orderBy: { bidDeadline: "asc" },
    take: 100,
    include: { requesterOrg: { select: { id: true, name: true, city: true } }, bids: { where: { providerOrgId: actor.org.id }, select: { status: true, pricePerTripCents: true } } },
  });
}

export async function listOwnTenders(actor: Actor | null) {
  requirePermission(actor, "transfers.request");
  return db.tender.findMany({
    where: { requesterOrgId: actor.org.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { _count: { select: { bids: { where: { status: "SUBMITTED" } } } }, awardedBid: { select: { pricePerTripCents: true, providerOrg: { select: { name: true } } } } },
  });
}

export type TenderRole = "requester" | "bidder";

/** Detail: der Auftraggeber sieht alle Angebote, ein Betrieb nur das eigene. */
export async function getTender(actor: Actor | null, id: string) {
  requirePermission(actor, "org.read");
  const tender = await db.tender.findUnique({ where: { id }, include: { requesterOrg: { select: orgSelect } } });
  if (!tender) throw notFound();
  let role: TenderRole;
  if (tender.requesterOrgId === actor.org.id) role = "requester";
  else if (actorCan(actor, "jobs.accept") && (await db.tender.count({ where: { id, ...visibleTo(actor.org.id) } })) === 1) role = "bidder";
  else throw notFound();
  const bids = await db.tenderBid.findMany({
    where: role === "requester" ? { tenderId: id, status: { not: "WITHDRAWN" } } : { tenderId: id, providerOrgId: actor.org.id },
    orderBy: [{ status: "asc" }, { pricePerTripCents: "asc" }],
    include: { providerOrg: { select: { ...orgSelect, transportProfile: { select: { fleetSize: true } } } } },
  });
  // Abgeschlossene Ausschreibungen sieht ein Betrieb nur, wenn er geboten hat.
  if (role === "bidder" && tender.status !== "OPEN" && bids.length === 0) throw notFound();
  const won = role === "bidder" && bids.some((b) => b.id === tender.awardedBidId);
  return {
    role,
    tender: { ...tender, requesterOrg: role === "requester" || won ? tender.requesterOrg : { ...tender.requesterOrg, email: null, phone: null } },
    bids,
    open: tender.status === "OPEN" && tender.bidDeadline > new Date(),
  };
}

/** Angebot abgeben oder ändern: fester Preis je Fahrt. */
export async function submitTenderBid(actor: Actor | null, tenderId: string, input: unknown) {
  requirePermission(actor, "quotes.submit");
  const d = parse(bidSchema, input);
  const tender = await db.tender.findFirst({ where: { id: tenderId, status: "OPEN", bidDeadline: { gt: new Date() }, ...visibleTo(actor.org.id) }, include: { requesterOrg: { select: orgSelect } } });
  if (!tender) throw notFound("Ausschreibung nicht gefunden oder bereits beendet.");
  const bid = await db.tenderBid.upsert({
    where: { tenderId_providerOrgId: { tenderId, providerOrgId: actor.org.id } },
    create: { tenderId, providerOrgId: actor.org.id, createdById: actor.userId, pricePerTripCents: d.pricePerTripCents, message: d.message ?? null },
    update: { pricePerTripCents: d.pricePerTripCents, message: d.message ?? null, status: "SUBMITTED", createdById: actor.userId },
  });
  await sendAll([mail(tender.requesterOrg, tender, "Neues Angebot zur Ausschreibung {route}", ["{org} bietet {price} je Fahrt."], { org: actor.org.name, price: formatCents(bid.pricePerTripCents) })]).catch(notificationFailed);
  return bid;
}

export async function withdrawTenderBid(actor: Actor | null, tenderId: string) {
  requirePermission(actor, "quotes.submit");
  const res = await db.tenderBid.updateMany({ where: { tenderId, providerOrgId: actor.org.id, status: "SUBMITTED", tender: { status: "OPEN" } }, data: { status: "WITHDRAWN" } });
  if (res.count !== 1) throw invalid("Dieses Angebot lässt sich nicht mehr zurückziehen.");
}

/** Zuschlag: ein Angebot wird angenommen, alle anderen abgelehnt, die Ausschreibung ist vergeben. */
export async function awardTender(actor: Actor | null, bidId: string) {
  requirePermission(actor, "bookings.manage");
  const bid = await db.tenderBid.findFirst({
    where: { id: bidId, status: "SUBMITTED", tender: { requesterOrgId: actor.org.id, status: "OPEN" } },
    include: { tender: true, providerOrg: { select: orgSelect } },
  });
  if (!bid) throw notFound("Angebot nicht gefunden oder Ausschreibung bereits vergeben.");
  const losers = await db.$transaction(async (tx) => {
    const res = await tx.tender.updateMany({ where: { id: bid.tenderId, status: "OPEN" }, data: { status: "AWARDED", awardedBidId: bid.id } });
    if (res.count !== 1) throw invalid("Diese Ausschreibung ist bereits vergeben.");
    await tx.tenderBid.update({ where: { id: bid.id }, data: { status: "ACCEPTED" } });
    const others = await tx.tenderBid.findMany({ where: { tenderId: bid.tenderId, status: "SUBMITTED" }, select: { providerOrg: { select: orgSelect } } });
    await tx.tenderBid.updateMany({ where: { tenderId: bid.tenderId, status: "SUBMITTED" }, data: { status: "REJECTED" } });
    return others.map((o) => o.providerOrg);
  });
  const vars = { org: actor.org.name, price: formatCents(bid.pricePerTripCents) };
  await sendAll([
    mail(bid.providerOrg, bid.tender, "Zuschlag für die Ausschreibung {route}", ["{org} hat Ihr Angebot von {price} je Fahrt angenommen.", "Die einzelnen Fahrten erhalten Sie als Direktanfragen in der Börse."], vars),
    ...losers.map((o) => mail(o, bid.tender, "Ausschreibung {route} vergeben", ["{org} hat die Ausschreibung an einen anderen Betrieb vergeben."], vars)),
  ]).catch(notificationFailed);
  return bid;
}

/** Ausschreibung ohne Zuschlag beenden. */
export async function closeTender(actor: Actor | null, id: string) {
  requirePermission(actor, "transfers.request");
  const res = await db.tender.updateMany({ where: { id, requesterOrgId: actor.org.id, status: "OPEN" }, data: { status: "CLOSED" } });
  if (res.count !== 1) throw notFound();
  await db.tenderBid.updateMany({ where: { tenderId: id, status: "SUBMITTED" }, data: { status: "REJECTED" } });
}

// ---------------------------------------------------------------------------
// E-Mails
// ---------------------------------------------------------------------------

type MailOrg = { email: string; country: string };
type MailTender = { id: string; pickupPlaceId: string; dropoffPlaceId: string; dateFrom: Date; dateTo: Date; estimatedTrips: number };

function mail(org: MailOrg, tender: MailTender, subject: string, lines: string[], vars: Record<string, string | number> = {}): Email {
  const locale = ["AT", "DE", "CH", "LI"].includes(org.country) ? "de" : "en";
  const t = makeT(locale);
  const v = {
    route: `${t(placeName(tender.pickupPlaceId))} ↔ ${t(placeName(tender.dropoffPlaceId))}`,
    from: fmtDate(tender.dateFrom, locale),
    to: fmtDate(tender.dateTo, locale),
    trips: tender.estimatedTrips,
    ...vars,
  };
  return {
    to: org.email,
    subject: `Transferborsa: ${t(subject, v)}`,
    text: [...lines.map((l) => t(l, v)), "", appUrl(`/boerse/ausschreibung/${tender.id}`), "", "—", t("Diese Nachricht wurde automatisch von Transferborsa verschickt.")].join("\n"),
  };
}

/** Neue Ausschreibung: E-Mail an geprüfte Betriebe, die E-Mails zu neuen Aufträgen wollen. */
async function notifyTenderCreated(tenderId: string) {
  const tender = await db.tender.findUniqueOrThrow({ where: { id: tenderId }, include: { requesterOrg: { select: { name: true } } } });
  const providers = await db.organization.findMany({
    where: {
      id: { not: tender.requesterOrgId },
      status: "ACTIVE",
      mailNewJobs: true,
      capabilities: { some: { capability: "TRANSPORT_PROVIDER", status: "VERIFIED" } },
      blockedBy: { none: { orgId: tender.requesterOrgId } },
    },
    select: { email: true, country: true },
  });
  await sendAll(providers.map((p) => mail(p, tender, "Neue Ausschreibung {route}", ["{org} schreibt etwa {trips} Fahrten aus, {from} bis {to}.", "Bieten Sie einen festen Preis je Fahrt."], { org: tender.requesterOrg.name })));
}
