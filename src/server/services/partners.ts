import type { Audience } from "@prisma/client";
import { Prisma as P } from "@prisma/client";
import { db } from "@/lib/db";
import { splitHandoff } from "@/lib/handoff";
import { requirePermission, type Actor } from "../authz/context";
import { conflict, invalid, notFound } from "../errors";
import { notificationFailed, notifyNewRequest } from "../notifications";
import { ownVehicleId, scopeSnapshot } from "./marketplace";
import { transferEvent } from "./transfer-events";

/** Höchstzahl Partner je Unternehmen */
export const MAX_PARTNERS = 100;

// ---------------------------------------------------------------------------
// Partnernetzwerk verwalten
// ---------------------------------------------------------------------------

export async function listPartners(actor: Actor | null) {
  requirePermission(actor, "org.read");
  const links = await db.partnerLink.findMany({
    where: { orgId: actor.org.id },
    include: { partnerOrg: { select: { id: true, name: true, city: true, country: true, status: true } } },
    orderBy: { partnerOrg: { name: "asc" } },
  });
  return links.map((l) => l.partnerOrg);
}

/** Geprüfte Beförderungsunternehmen, die noch nicht Partner sind (zum Auswählen). */
export async function listPartnerCandidates(actor: Actor | null) {
  requirePermission(actor, "org.read");
  return db.organization.findMany({
    where: {
      id: { not: actor.org.id },
      status: "ACTIVE",
      capabilities: { some: { capability: "TRANSPORT_PROVIDER", status: "VERIFIED" } },
      partnerOf: { none: { orgId: actor.org.id } },
    },
    select: { id: true, name: true, city: true, country: true },
    orderBy: { name: "asc" },
    take: 300,
  });
}

export async function addPartner(actor: Actor | null, partnerOrgId: string) {
  requirePermission(actor, "transfers.request");
  if (partnerOrgId === actor.org.id) throw invalid("Das eigene Unternehmen kann kein Partner sein.");
  const org = await db.organization.findFirst({
    where: { id: partnerOrgId, status: "ACTIVE", capabilities: { some: { capability: "TRANSPORT_PROVIDER", status: "VERIFIED" } } },
    select: { id: true },
  });
  if (!org) throw invalid("Dieses Unternehmen ist nicht freigeschaltet.");
  if ((await db.partnerLink.count({ where: { orgId: actor.org.id } })) >= MAX_PARTNERS) throw invalid("Höchstens 100 Partner.");
  await db.partnerLink.upsert({
    where: { orgId_partnerOrgId: { orgId: actor.org.id, partnerOrgId } },
    create: { orgId: actor.org.id, partnerOrgId },
    update: {},
  });
}

export async function removePartner(actor: Actor | null, partnerOrgId: string) {
  requirePermission(actor, "transfers.request");
  await db.partnerLink.deleteMany({ where: { orgId: actor.org.id, partnerOrgId } });
}

// ---------------------------------------------------------------------------
// Stufen: eigener Betrieb → Partner → gesamte Börse
// ---------------------------------------------------------------------------

/** Nächste Stufe; Stufe 2 entfällt, wenn der Auftraggeber keine Partner hat. */
export function nextAudience(current: Audience, hasPartners: boolean): Audience {
  if (current === "OWN") return hasPartners ? "PARTNERS" : "MARKET";
  return "MARKET";
}

/** Setzt einen offenen Auftrag auf die nächste Stufe (bedingt, damit parallele Aufrufe nicht doppelt weiterschalten). */
async function advance(requestId: string, from: Audience, actor: { userId: string; orgId: string } | null, auto: boolean) {
  const req = await db.transferRequest.findUnique({ where: { id: requestId }, select: { requesterOrgId: true } });
  if (!req) return false;
  const partnerIds = (await db.partnerLink.findMany({ where: { orgId: req.requesterOrgId }, select: { partnerOrgId: true } })).map((l) => l.partnerOrgId);
  const to = nextAudience(from, partnerIds.length > 0);
  if (to === from) return false;
  const moved = await db.$transaction(async (tx) => {
    const res = await tx.transferRequest.updateMany({
      where: { id: requestId, status: "OPEN", visibility: "MARKET", audience: from },
      data: { audience: to, audienceSince: new Date() },
    });
    if (res.count !== 1) return false;
    await transferEvent(tx, requestId, "request.audience_changed", actor, { from, to, auto });
    return true;
  });
  if (moved) await notifyNewRequest(requestId, from === "PARTNERS" ? partnerIds : []).catch(notificationFailed);
  return moved;
}

/** Auftraggeber gibt den Auftrag sofort an die nächste Stufe weiter. */
export async function advanceAudience(actor: Actor | null, requestId: string) {
  requirePermission(actor, "transfers.request");
  const req = await db.transferRequest.findFirst({
    where: { id: requestId, requesterOrgId: actor.org.id, status: "OPEN", visibility: "MARKET" },
    select: { audience: true },
  });
  if (!req || req.audience === "MARKET") throw notFound("Auftrag nicht gefunden oder bereits in der Börse.");
  if (!(await advance(requestId, req.audience, { userId: actor.userId, orgId: actor.org.id }, false))) {
    throw conflict("Der Auftrag wurde soeben weitergegeben.");
  }
}

/**
 * Gibt alle Aufträge, deren Frist ohne Übernahme abgelaufen ist, an die nächste Stufe weiter.
 * Läuft beim Öffnen der Börse und täglich per Cron; ist idempotent.
 */
export async function escalateDueRequests(now = new Date()) {
  const open = await db.transferRequest.findMany({
    where: { status: "OPEN", visibility: "MARKET", audience: { not: "MARKET" }, escalateAfterMinutes: { not: null }, pickupAt: { gt: now } },
    select: { id: true, audience: true, audienceSince: true, escalateAfterMinutes: true },
    take: 200,
  });
  let n = 0;
  for (const r of open) {
    if (r.audienceSince.getTime() + r.escalateAfterMinutes! * 60_000 > now.getTime()) continue;
    if (await advance(r.id, r.audience, null, true)) n++;
  }
  return n;
}

// ---------------------------------------------------------------------------
// Stufe 1: eigener Betrieb übernimmt selbst
// ---------------------------------------------------------------------------

/** Der Auftraggeber fährt den Auftrag mit den eigenen Fahrern/Fahrzeugen: es entsteht eine Buchung ohne Fremdfirma. */
export async function takeOwnRequest(actor: Actor | null, requestId: string, input: { vehicleId?: string } = {}) {
  requirePermission(actor, "jobs.accept");
  const req = await db.transferRequest.findFirst({ where: { id: requestId, requesterOrgId: actor.org.id } });
  if (!req || req.status !== "OPEN") throw notFound("Auftrag nicht mehr verfügbar.");
  if (req.pickupAt <= new Date()) throw invalid("Die Abholzeit ist bereits vorbei.");
  const vehicleId = await ownVehicleId(actor, input.vehicleId);
  try {
    return await db.$transaction(async (tx) => {
      const locked = await tx.transferRequest.updateMany({ where: { id: requestId, status: "OPEN" }, data: { status: "ASSIGNED" } });
      if (locked.count !== 1) throw conflict("Dieser Auftrag wurde soeben vergeben.");
      const split = splitHandoff(req.priceCents ?? 0, 0);
      const booking = await tx.booking.create({
        data: {
          requestId,
          requesterOrgId: actor.org.id,
          providerOrgId: actor.org.id,
          vehicleId,
          agreedPriceCents: split.priceCents,
          currency: req.currency,
          scope: scopeSnapshot(req),
          cancellationTerms: req.cancellationTerms,
          acceptedById: actor.userId,
        },
      });
      await tx.quote.updateMany({ where: { requestId, status: "SUBMITTED" }, data: { status: "REJECTED" } });
      await tx.quoteInvitation.updateMany({ where: { requestId, status: "PENDING" }, data: { status: "DECLINED", respondedAt: new Date() } });
      await transferEvent(tx, requestId, "booking.taken_by_own_fleet", { userId: actor.userId, orgId: actor.org.id }, { bookingId: booking.id });
      return booking;
    });
  } catch (e) {
    if (e instanceof P.PrismaClientKnownRequestError && e.code === "P2002") throw conflict("Dieser Auftrag wurde soeben vergeben.");
    throw e;
  }
}

