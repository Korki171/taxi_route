import type { Prisma, TransferStatus, VehicleCategory } from "@prisma/client";
import { Prisma as P } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { estimateMinutes, isPlaceId, PLACES, type Place } from "@/lib/places";
import { actorCan, requirePermission, type Actor, type OrgActor } from "../authz/context";
import { conflict, forbidden, invalid, notFound } from "../errors";
import { parse } from "../validation";
import { categoryFits } from "./matching";
import { transferEvent } from "./transfer-events";

// ---------------------------------------------------------------------------
// Validierung
// ---------------------------------------------------------------------------

const vehicleCategory = z.enum(["SEDAN", "ESTATE", "MINIVAN", "VAN", "MINIBUS", "BUS", "LUXURY", "WHEELCHAIR"]);
const optText = (max: number) => z.string().trim().max(max).optional().transform((v) => v || undefined);
const optInt = (max: number) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().min(0).max(max).optional());
const optDate = z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.date().optional());

export const transferRequestSchema = z
  .object({
    pickupPlaceId: z.string().refine(isPlaceId, "Unbekannter Abholort"),
    dropoffPlaceId: z.string().refine(isPlaceId, "Unbekannter Zielort"),
    pickupAddress: optText(200),
    dropoffAddress: optText(200),
    pickupAt: z.coerce.date(),
    pickupWindowMinutes: optInt(240).transform((v) => v ?? 0),
    passengers: z.coerce.number().int().min(1).max(60),
    luggage: optInt(80).transform((v) => v ?? 0),
    skiEquipment: optInt(60).transform((v) => v ?? 0),
    specialLuggage: optText(200),
    vehicleCategory: z.preprocess((v) => (v === "" ? undefined : v), vehicleCategory.optional()),
    childSeats: optInt(10).transform((v) => v ?? 0),
    requirements: optText(500),
    flightNumber: optText(12),
    flightArrivalAt: optDate,
    pickupNotes: optText(500),
    priceMode: z.enum(["FIXED", "NEGOTIABLE"]),
    priceCents: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().min(100).max(10_000_00).optional()),
    quoteDeadline: optDate,
    bookingTerms: optText(1000),
    cancellationTerms: optText(500),
    clientReference: optText(60),
    passengerName: optText(120),
    passengerPhone: optText(40),
  })
  .refine((d) => d.pickupPlaceId !== d.dropoffPlaceId, { message: "Abhol- und Zielort müssen sich unterscheiden", path: ["dropoffPlaceId"] })
  .refine((d) => d.priceMode !== "FIXED" || d.priceCents != null, { message: "Für einen Festpreis bitte einen Betrag angeben", path: ["priceCents"] })
  .refine((d) => !d.quoteDeadline || d.quoteDeadline < d.pickupAt, { message: "Die Angebotsfrist muss vor der Abholung liegen", path: ["quoteDeadline"] });

const quoteSchema = z.object({
  amountCents: z.coerce.number().int().min(100).max(10_000_00),
  vehicleCategory,
  message: optText(500),
  validUntil: optDate,
});

// ---------------------------------------------------------------------------
// Sichtbarkeit
// ---------------------------------------------------------------------------

/** Was eine fremde Organisation in der Börse sieht: keine Adressen, Fahrgastdaten oder Kundenreferenzen. */
const marketSelect = {
  id: true,
  number: true,
  status: true,
  pickupPlaceId: true,
  dropoffPlaceId: true,
  pickupAt: true,
  pickupWindowMinutes: true,
  estimatedMinutes: true,
  passengers: true,
  luggage: true,
  skiEquipment: true,
  specialLuggage: true,
  vehicleCategory: true,
  childSeats: true,
  requirements: true,
  flightNumber: true,
  flightArrivalAt: true,
  priceMode: true,
  priceCents: true,
  currency: true,
  quoteDeadline: true,
  bookingTerms: true,
  cancellationTerms: true,
  createdAt: true,
  requesterOrg: { select: { id: true, name: true, city: true, type: true } },
} satisfies Prisma.TransferRequestSelect;

export type MarketRequest = Prisma.TransferRequestGetPayload<{ select: typeof marketSelect }>;

export function referenceOf(number: number) {
  return `TR-${String(number).padStart(6, "0")}`;
}

/** Nur Organisationen mit verifizierter Beförderungsfunktion dürfen Aufträge sehen und annehmen. */
function requireMarketAccess(actor: Actor | null): asserts actor is OrgActor {
  requirePermission(actor, "jobs.accept");
}

const OPEN_FOR_MARKET = (now: Date): Prisma.TransferRequestWhereInput => ({
  status: "OPEN",
  pickupAt: { gt: now },
  OR: [{ quoteDeadline: null }, { quoteDeadline: { gt: now } }],
});

// ---------------------------------------------------------------------------
// Aufträge einstellen
// ---------------------------------------------------------------------------

export async function createTransferRequest(actor: Actor | null, input: unknown) {
  requirePermission(actor, "transfers.request");
  const d = parse(transferRequestSchema, input);
  if (d.pickupAt <= new Date()) throw invalid("Die Abholzeit liegt in der Vergangenheit.");

  return db.$transaction(async (tx) => {
    const req = await tx.transferRequest.create({
      data: {
        requesterOrgId: actor.org.id,
        createdById: actor.userId,
        pickupPlaceId: d.pickupPlaceId,
        dropoffPlaceId: d.dropoffPlaceId,
        pickupAddress: d.pickupAddress,
        dropoffAddress: d.dropoffAddress,
        pickupAt: d.pickupAt,
        pickupWindowMinutes: d.pickupWindowMinutes,
        estimatedMinutes: estimateMinutes(d.pickupPlaceId, d.dropoffPlaceId),
        passengers: d.passengers,
        luggage: d.luggage,
        skiEquipment: d.skiEquipment,
        specialLuggage: d.specialLuggage,
        vehicleCategory: d.vehicleCategory,
        childSeats: d.childSeats,
        requirements: d.requirements,
        flightNumber: d.flightNumber,
        flightArrivalAt: d.flightArrivalAt,
        pickupNotes: d.pickupNotes,
        priceMode: d.priceMode,
        priceCents: d.priceCents,
        quoteDeadline: d.quoteDeadline,
        bookingTerms: d.bookingTerms,
        cancellationTerms: d.cancellationTerms,
        clientReference: d.clientReference,
        passengersContact: d.passengerName ? { create: { name: d.passengerName, phone: d.passengerPhone } } : undefined,
      },
    });
    await transferEvent(tx, req.id, "request.created", { userId: actor.userId, orgId: actor.org.id }, {
      priceMode: d.priceMode,
      priceCents: d.priceCents ?? null,
    });
    return req;
  });
}

export async function cancelTransferRequest(actor: Actor | null, requestId: string) {
  requirePermission(actor, "transfers.request");
  await db.$transaction(async (tx) => {
    const res = await tx.transferRequest.updateMany({
      where: { id: requestId, requesterOrgId: actor.org.id, status: "OPEN" },
      data: { status: "CANCELLED" },
    });
    if (res.count === 0) throw notFound("Auftrag nicht gefunden oder bereits vergeben.");
    await tx.quote.updateMany({ where: { requestId, status: "SUBMITTED" }, data: { status: "REJECTED" } });
    await transferEvent(tx, requestId, "request.cancelled", { userId: actor.userId, orgId: actor.org.id });
  });
}

// ---------------------------------------------------------------------------
// Börse: Suche und Filter
// ---------------------------------------------------------------------------

export const boardFilterSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  fromRegion: z.string().optional(),
  toRegion: z.string().optional(),
  country: z.string().optional(),
  dateFrom: optDate,
  dateTo: optDate,
  vehicleCategory: z.preprocess((v) => (v === "" ? undefined : v), vehicleCategory.optional()),
  minPassengers: optInt(60),
  maxPassengers: optInt(60),
  maxPrice: optInt(10_000_00),
  minPrice: optInt(10_000_00),
  priceMode: z.preprocess((v) => (v === "" ? undefined : v), z.enum(["FIXED", "NEGOTIABLE"]).optional()),
  newOnly: z.preprocess((v) => v === "1" || v === true, z.boolean()).optional(),
});
export type BoardFilter = z.infer<typeof boardFilterSchema>;

const PLACE_IDS_IN = (pred: (p: Place) => boolean) => PLACES.filter(pred).map((p) => p.id);

/** Offene Aufträge anderer Organisationen. Filter laufen in der Datenbank. */
export async function searchBoard(actor: Actor | null, rawFilter: unknown = {}) {
  requireMarketAccess(actor);
  const f = parse(boardFilterSchema, rawFilter);
  const now = new Date();
  const and: Prisma.TransferRequestWhereInput[] = [OPEN_FOR_MARKET(now), { requesterOrgId: { not: actor.org.id } }];

  if (f.from) and.push({ pickupPlaceId: f.from });
  if (f.to) and.push({ dropoffPlaceId: f.to });
  if (f.fromRegion) and.push({ pickupPlaceId: { in: PLACE_IDS_IN((p) => p.region === f.fromRegion) } });
  if (f.toRegion) and.push({ dropoffPlaceId: { in: PLACE_IDS_IN((p) => p.region === f.toRegion) } });
  if (f.country) {
    const ids = PLACE_IDS_IN((p) => p.country === f.country);
    and.push({ OR: [{ pickupPlaceId: { in: ids } }, { dropoffPlaceId: { in: ids } }] });
  }
  if (f.dateFrom) and.push({ pickupAt: { gte: f.dateFrom } });
  if (f.dateTo) and.push({ pickupAt: { lte: new Date(f.dateTo.getTime() + 24 * 3600_000 - 1) } });
  if (f.vehicleCategory) {
    // Filter = eigenes Fahrzeug: alle Aufträge, die damit gefahren werden können
    const fits = vehicleCategory.options.filter((wanted) => categoryFits(f.vehicleCategory!, wanted));
    and.push({ OR: [{ vehicleCategory: { in: fits } }, { vehicleCategory: null }] });
  }
  if (f.minPassengers != null) and.push({ passengers: { gte: f.minPassengers } });
  if (f.maxPassengers != null) and.push({ passengers: { lte: f.maxPassengers } });
  if (f.minPrice != null) and.push({ priceCents: { gte: f.minPrice } });
  if (f.maxPrice != null) and.push({ priceCents: { lte: f.maxPrice } });
  if (f.priceMode) and.push({ priceMode: f.priceMode });
  if (f.newOnly) and.push({ createdAt: { gte: new Date(now.getTime() - 24 * 3600_000) } });

  const rows = await db.transferRequest.findMany({
    where: {
      AND: and,
      // Nur Aufträge aktiver Auftraggeber
      requesterOrg: { status: "ACTIVE" },
    },
    orderBy: { pickupAt: "asc" },
    take: 200,
    select: {
      ...marketSelect,
      quotes: { where: { providerOrgId: actor.org.id }, select: { id: true, status: true, amountCents: true } },
    },
  });
  return rows;
}

// ---------------------------------------------------------------------------
// Detailansicht mit rollenabhängiger Sichtbarkeit
// ---------------------------------------------------------------------------

export type RequestRole = "requester" | "provider" | "market";

export async function getTransferRequest(actor: Actor | null, requestId: string) {
  requirePermission(actor, "org.read");
  const req = await db.transferRequest.findUnique({
    where: { id: requestId },
    include: {
      requesterOrg: { select: { id: true, name: true, city: true, type: true, email: true, phone: true } },
      booking: { include: { providerOrg: { select: { id: true, name: true, city: true, email: true, phone: true } }, vehicle: true } },
    },
  });
  if (!req) throw notFound();

  let role: RequestRole;
  if (req.requesterOrgId === actor.org.id) role = "requester";
  else if (req.booking?.providerOrgId === actor.org.id) role = "provider";
  else if (req.status === "OPEN" && actorCan(actor, "jobs.accept")) role = "market";
  // Vergebene oder fremde Aufträge ohne Beteiligung: so tun, als gäbe es sie nicht.
  else throw notFound();

  const involved = role !== "market";
  const [contacts, quotes, events] = await Promise.all([
    involved ? db.passengerContact.findMany({ where: { requestId } }) : Promise.resolve([]),
    db.quote.findMany({
      where: role === "requester" ? { requestId } : { requestId, providerOrgId: actor.org.id },
      orderBy: [{ status: "asc" }, { amountCents: "asc" }],
      include: {
        providerOrg: {
          select: { id: true, name: true, city: true, transportProfile: { select: { vehicleCategories: true, fleetSize: true } } },
        },
      },
    }),
    involved ? db.transferEvent.findMany({ where: { requestId }, orderBy: { createdAt: "asc" } }) : Promise.resolve([]),
  ]);

  // Das ausführende Unternehmen sieht nicht, wer sonst mit welchem Preis angeboten hat.
  const visibleEvents =
    role === "provider"
      ? events.filter((e) => !e.type.startsWith("quote.") || e.type === "quote.accepted" || e.actorOrgId === actor.org.id)
      : events;

  return {
    role,
    request: {
      ...req,
      // Fremde sehen weder Adressen noch Hinweise, Referenzen oder Kontaktdaten des Auftraggebers.
      pickupAddress: involved ? req.pickupAddress : null,
      dropoffAddress: involved ? req.dropoffAddress : null,
      pickupNotes: involved ? req.pickupNotes : null,
      clientReference: role === "requester" ? req.clientReference : null,
      requesterOrg: involved
        ? req.requesterOrg
        : { ...req.requesterOrg, email: null, phone: null },
    },
    contacts,
    quotes,
    events: visibleEvents,
  };
}

// ---------------------------------------------------------------------------
// Festpreis übernehmen (Szenario A, ohne Verhandlung)
// ---------------------------------------------------------------------------

function scopeSnapshot(r: {
  pickupPlaceId: string; dropoffPlaceId: string; pickupAt: Date; passengers: number; luggage: number;
  skiEquipment: number; childSeats: number; vehicleCategory: VehicleCategory | null; requirements: string | null;
  flightNumber: string | null; bookingTerms: string | null;
}, vehicleCategoryOverride?: VehicleCategory): Prisma.InputJsonValue {
  return {
    pickupPlaceId: r.pickupPlaceId,
    dropoffPlaceId: r.dropoffPlaceId,
    pickupAt: r.pickupAt.toISOString(),
    passengers: r.passengers,
    luggage: r.luggage,
    skiEquipment: r.skiEquipment,
    childSeats: r.childSeats,
    vehicleCategory: vehicleCategoryOverride ?? r.vehicleCategory,
    requirements: r.requirements,
    flightNumber: r.flightNumber,
    bookingTerms: r.bookingTerms,
  };
}

/**
 * Übernimmt einen Festpreis-Auftrag. Doppelte Annahmen verhindern zwei Sperren:
 * das bedingte Statusupdate (nur OPEN → ASSIGNED, genau eine Zeile) und der
 * eindeutige Schlüssel auf Booking.requestId.
 */
export async function takeFixedPriceRequest(actor: Actor | null, requestId: string, input: { vehicleId?: string } = {}) {
  requireMarketAccess(actor);
  const req = await db.transferRequest.findUnique({ where: { id: requestId } });
  if (!req || req.status !== "OPEN") throw notFound("Auftrag nicht mehr verfügbar.");
  if (req.requesterOrgId === actor.org.id) throw forbidden("Eigene Aufträge können nicht übernommen werden.");
  if (req.priceMode !== "FIXED" || req.priceCents == null) throw invalid("Dieser Auftrag ist verhandelbar. Bitte ein Angebot abgeben.");
  if (req.pickupAt <= new Date()) throw invalid("Die Abholzeit ist bereits vorbei.");
  const vehicleId = await ownVehicleId(actor, input.vehicleId);

  try {
    return await db.$transaction(async (tx) => {
      const locked = await tx.transferRequest.updateMany({ where: { id: requestId, status: "OPEN" }, data: { status: "ASSIGNED" } });
      if (locked.count !== 1) throw conflict("Dieser Auftrag wurde soeben von einem anderen Unternehmen übernommen.");
      const booking = await tx.booking.create({
        data: {
          requestId,
          requesterOrgId: req.requesterOrgId,
          providerOrgId: actor.org.id,
          vehicleId,
          agreedPriceCents: req.priceCents!,
          currency: req.currency,
          scope: scopeSnapshot(req),
          cancellationTerms: req.cancellationTerms,
          acceptedById: actor.userId,
        },
      });
      await tx.quote.updateMany({ where: { requestId, status: "SUBMITTED" }, data: { status: "REJECTED" } });
      await transferEvent(tx, requestId, "booking.fixed_price_taken", { userId: actor.userId, orgId: actor.org.id }, {
        bookingId: booking.id,
        agreedPriceCents: booking.agreedPriceCents,
      });
      return booking;
    });
  } catch (e) {
    if (e instanceof P.PrismaClientKnownRequestError && e.code === "P2002") {
      throw conflict("Dieser Auftrag wurde soeben von einem anderen Unternehmen übernommen.");
    }
    throw e;
  }
}

async function ownVehicleId(actor: OrgActor, vehicleId?: string) {
  if (!vehicleId) return undefined;
  const v = await db.vehicle.findFirst({ where: { id: vehicleId, organizationId: actor.org.id, active: true } });
  if (!v) throw invalid("Fahrzeug nicht gefunden.");
  return v.id;
}

// ---------------------------------------------------------------------------
// Angebote
// ---------------------------------------------------------------------------

export async function submitQuote(actor: Actor | null, requestId: string, input: unknown) {
  requirePermission(actor, "quotes.submit");
  const d = parse(quoteSchema, input);
  const now = new Date();
  const req = await db.transferRequest.findFirst({ where: { id: requestId, ...OPEN_FOR_MARKET(now) } });
  if (!req) throw notFound("Auftrag nicht mehr verfügbar oder Angebotsfrist abgelaufen.");
  if (req.requesterOrgId === actor.org.id) throw forbidden("Auf eigene Aufträge kann kein Angebot abgegeben werden.");
  if (d.validUntil && d.validUntil <= now) throw invalid("Die Gültigkeit des Angebots liegt in der Vergangenheit.");

  return db.$transaction(async (tx) => {
    const existing = await tx.quote.findUnique({ where: { requestId_providerOrgId: { requestId, providerOrgId: actor.org.id } } });
    if (existing && (existing.status === "ACCEPTED" || existing.status === "REJECTED")) {
      throw invalid("Ihr Angebot wurde bereits entschieden.");
    }
    const quote = await tx.quote.upsert({
      where: { requestId_providerOrgId: { requestId, providerOrgId: actor.org.id } },
      create: { requestId, providerOrgId: actor.org.id, createdById: actor.userId, ...d },
      update: { ...d, createdById: actor.userId, status: "SUBMITTED", message: d.message ?? null, validUntil: d.validUntil ?? null },
    });
    await transferEvent(tx, requestId, "quote.submitted", { userId: actor.userId, orgId: actor.org.id }, {
      quoteId: quote.id,
      amountCents: quote.amountCents,
      vehicleCategory: quote.vehicleCategory,
    });
    return quote;
  });
}

export async function withdrawQuote(actor: Actor | null, quoteId: string) {
  requirePermission(actor, "quotes.submit");
  const q = await db.quote.findFirst({ where: { id: quoteId, providerOrgId: actor.org.id, status: "SUBMITTED" } });
  if (!q) throw notFound();
  await db.$transaction(async (tx) => {
    await tx.quote.update({ where: { id: q.id }, data: { status: "WITHDRAWN" } });
    await transferEvent(tx, q.requestId, "quote.withdrawn", { userId: actor.userId, orgId: actor.org.id }, { quoteId });
  });
}

export async function rejectQuote(actor: Actor | null, quoteId: string) {
  requirePermission(actor, "bookings.manage");
  const q = await db.quote.findFirst({
    where: { id: quoteId, status: "SUBMITTED", request: { requesterOrgId: actor.org.id } },
  });
  if (!q) throw notFound();
  await db.$transaction(async (tx) => {
    await tx.quote.update({ where: { id: q.id }, data: { status: "REJECTED" } });
    await transferEvent(tx, q.requestId, "quote.rejected", { userId: actor.userId, orgId: actor.org.id }, { quoteId });
  });
}

/** Auftraggeber nimmt ein Angebot an: daraus wird die verbindliche Buchung. */
export async function acceptQuote(actor: Actor | null, quoteId: string) {
  requirePermission(actor, "bookings.manage");
  const q = await db.quote.findFirst({
    where: { id: quoteId, request: { requesterOrgId: actor.org.id } },
    include: { request: true, providerOrg: { select: { status: true, capabilities: true } } },
  });
  if (!q) throw notFound();
  if (q.status !== "SUBMITTED") throw invalid("Dieses Angebot ist nicht mehr gültig.");
  if (q.validUntil && q.validUntil <= new Date()) throw invalid("Dieses Angebot ist abgelaufen.");
  // Der Anbieter muss zum Zeitpunkt der Annahme noch berechtigt sein.
  const providerOk =
    q.providerOrg.status === "ACTIVE" &&
    q.providerOrg.capabilities.some((c) => c.capability === "TRANSPORT_PROVIDER" && c.status === "VERIFIED");
  if (!providerOk) throw invalid("Das anbietende Unternehmen ist derzeit nicht freigeschaltet.");
  const req = q.request;

  try {
    return await db.$transaction(async (tx) => {
      const locked = await tx.transferRequest.updateMany({ where: { id: req.id, status: "OPEN" }, data: { status: "ASSIGNED" } });
      if (locked.count !== 1) throw conflict("Dieser Auftrag ist bereits vergeben.");
      const booking = await tx.booking.create({
        data: {
          requestId: req.id,
          quoteId: q.id,
          requesterOrgId: req.requesterOrgId,
          providerOrgId: q.providerOrgId,
          agreedPriceCents: q.amountCents,
          currency: req.currency,
          scope: scopeSnapshot(req, q.vehicleCategory),
          cancellationTerms: req.cancellationTerms,
          acceptedById: actor.userId,
        },
      });
      await tx.quote.update({ where: { id: q.id }, data: { status: "ACCEPTED" } });
      await tx.quote.updateMany({ where: { requestId: req.id, status: "SUBMITTED", id: { not: q.id } }, data: { status: "REJECTED" } });
      await transferEvent(tx, req.id, "quote.accepted", { userId: actor.userId, orgId: actor.org.id }, {
        quoteId: q.id,
        bookingId: booking.id,
        agreedPriceCents: q.amountCents,
      });
      return booking;
    });
  } catch (e) {
    if (e instanceof P.PrismaClientKnownRequestError && e.code === "P2002") throw conflict("Dieser Auftrag ist bereits vergeben.");
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Durchführung
// ---------------------------------------------------------------------------

const BOOKING_TO_REQUEST: Record<string, TransferStatus> = {
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  DISPUTED: "DISPUTED",
};

async function transitionBooking(
  actor: OrgActor,
  bookingId: string,
  who: "provider" | "either",
  from: ("CONFIRMED" | "IN_PROGRESS" | "COMPLETED")[],
  to: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "DISPUTED",
  eventType: string,
  note?: string,
) {
  const where: Prisma.BookingWhereInput =
    who === "provider"
      ? { id: bookingId, providerOrgId: actor.org.id }
      : { id: bookingId, OR: [{ providerOrgId: actor.org.id }, { requesterOrgId: actor.org.id }] };
  const b = await db.booking.findFirst({ where });
  if (!b) throw notFound();
  return db.$transaction(async (tx) => {
    const res = await tx.booking.updateMany({
      where: { id: b.id, status: { in: from } },
      data: { status: to, ...(to === "COMPLETED" ? { completedAt: new Date(), completionNote: note ?? null } : {}) },
    });
    if (res.count !== 1) throw invalid("Dieser Statuswechsel ist im aktuellen Zustand nicht möglich.");
    await tx.transferRequest.update({ where: { id: b.requestId }, data: { status: BOOKING_TO_REQUEST[to] } });
    await transferEvent(tx, b.requestId, eventType, { userId: actor.userId, orgId: actor.org.id }, note ? { note } : undefined);
  });
}

export async function startTrip(actor: Actor | null, bookingId: string) {
  requirePermission(actor, "jobs.accept");
  return transitionBooking(actor, bookingId, "provider", ["CONFIRMED"], "IN_PROGRESS", "booking.started");
}

export async function completeTrip(actor: Actor | null, bookingId: string, note?: string) {
  requirePermission(actor, "jobs.accept");
  const n = note?.trim().slice(0, 500) || undefined;
  return transitionBooking(actor, bookingId, "provider", ["CONFIRMED", "IN_PROGRESS"], "COMPLETED", "booking.completed", n);
}

export async function cancelBooking(actor: Actor | null, bookingId: string, reason: string) {
  requirePermission(actor, "org.read");
  if (!actorCan(actor, "bookings.manage") && !actorCan(actor, "jobs.accept")) throw forbidden();
  const r = reason.trim().slice(0, 500);
  if (!r) throw invalid("Bitte einen Grund für die Stornierung angeben.");
  return transitionBooking(actor, bookingId, "either", ["CONFIRMED"], "CANCELLED", "booking.cancelled", r);
}

export async function disputeBooking(actor: Actor | null, bookingId: string, reason: string) {
  requirePermission(actor, "org.read");
  if (!actorCan(actor, "bookings.manage") && !actorCan(actor, "jobs.accept")) throw forbidden();
  const r = reason.trim().slice(0, 1000);
  if (!r) throw invalid("Bitte beschreiben Sie das Problem.");
  return transitionBooking(actor, bookingId, "either", ["CONFIRMED", "IN_PROGRESS", "COMPLETED"], "DISPUTED", "booking.disputed", r);
}

// ---------------------------------------------------------------------------
// Ansichten der Börse
// ---------------------------------------------------------------------------

export async function listOwnRequests(actor: Actor | null, statuses?: TransferStatus[]) {
  requirePermission(actor, "transfers.request");
  return db.transferRequest.findMany({
    where: { requesterOrgId: actor.org.id, status: statuses ? { in: statuses } : undefined },
    orderBy: { pickupAt: "asc" },
    take: 200,
    include: {
      _count: { select: { quotes: { where: { status: "SUBMITTED" } } } },
      booking: { select: { id: true, agreedPriceCents: true, status: true, providerOrg: { select: { name: true } } } },
    },
  });
}

/** Eingegangene Angebote auf eigene, noch offene Aufträge. */
export async function listIncomingQuotes(actor: Actor | null) {
  requirePermission(actor, "bookings.manage");
  return db.quote.findMany({
    where: { status: "SUBMITTED", request: { requesterOrgId: actor.org.id, status: "OPEN" } },
    orderBy: [{ request: { pickupAt: "asc" } }, { amountCents: "asc" }],
    include: {
      providerOrg: { select: { name: true, city: true } },
      request: { select: { id: true, number: true, pickupPlaceId: true, dropoffPlaceId: true, pickupAt: true, passengers: true, priceCents: true, priceMode: true } },
    },
  });
}

export async function listOwnQuotes(actor: Actor | null) {
  requirePermission(actor, "quotes.submit");
  return db.quote.findMany({
    where: { providerOrgId: actor.org.id, status: { in: ["SUBMITTED", "REJECTED", "WITHDRAWN"] }, request: { pickupAt: { gt: new Date(Date.now() - 7 * 86400_000) } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { request: { select: { id: true, number: true, pickupPlaceId: true, dropoffPlaceId: true, pickupAt: true, status: true } } },
  });
}

/** Buchungen, an denen die eigene Organisation beteiligt ist. */
export async function listBookings(
  actor: Actor | null,
  side: "provider" | "requester" | "both",
  statuses: ("CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "DISPUTED")[],
) {
  requirePermission(actor, "org.read");
  const orgId = actor.org.id;
  const where: Prisma.BookingWhereInput = {
    status: { in: statuses },
    ...(side === "provider"
      ? { providerOrgId: orgId }
      : side === "requester"
        ? { requesterOrgId: orgId }
        : { OR: [{ providerOrgId: orgId }, { requesterOrgId: orgId }] }),
  };
  return db.booking.findMany({
    where,
    orderBy: { request: { pickupAt: "asc" } },
    take: 200,
    include: {
      request: { select: { id: true, number: true, pickupPlaceId: true, dropoffPlaceId: true, pickupAt: true, passengers: true, luggage: true } },
      providerOrg: { select: { id: true, name: true } },
      requesterOrg: { select: { id: true, name: true } },
    },
  });
}
