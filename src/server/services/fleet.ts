import { z } from "zod";
import { db } from "@/lib/db";
import { isPlaceId } from "@/lib/places";
import { requirePermission, type Actor } from "../authz/context";
import { invalid, notFound } from "../errors";
import { parse } from "../validation";
import { audit } from "./audit";

const vehicleCategory = z.enum(["SEDAN", "ESTATE", "MINIVAN", "VAN", "MINIBUS", "BUS", "LUXURY", "WHEELCHAIR"]);
const place = z.string().refine(isPlaceId, "Unbekannter Ort");

const vehicleSchema = z.object({
  label: z.string().trim().min(1).max(80),
  category: vehicleCategory,
  licensePlate: z.string().trim().max(20).optional().transform((v) => v || undefined),
  seats: z.coerce.number().int().min(1).max(60),
  luggage: z.coerce.number().int().min(0).max(80),
  skiCapacity: z.coerce.number().int().min(0).max(60).default(0),
});

export async function listVehicles(actor: Actor | null) {
  requirePermission(actor, "fleet.manage");
  return db.vehicle.findMany({ where: { organizationId: actor.org.id }, orderBy: [{ active: "desc" }, { label: "asc" }] });
}

export async function createVehicle(actor: Actor | null, input: unknown) {
  requirePermission(actor, "fleet.manage");
  const data = parse(vehicleSchema, input);
  const v = await db.vehicle.create({ data: { ...data, organizationId: actor.org.id } });
  await audit(db, { actorUserId: actor.userId, organizationId: actor.org.id, action: "vehicle.created", targetId: v.id });
  return v;
}

export async function setVehicleActive(actor: Actor | null, vehicleId: string, active: boolean) {
  requirePermission(actor, "fleet.manage");
  const res = await db.vehicle.updateMany({ where: { id: vehicleId, organizationId: actor.org.id }, data: { active } });
  if (res.count === 0) throw notFound();
}

const capacitySchema = z
  .object({
    vehicleId: z.string().optional().transform((v) => v || undefined),
    vehicleCategory: vehicleCategory.optional(),
    fromPlaceId: place,
    toPlaceId: place,
    availableFrom: z.coerce.date(),
    availableUntil: z.coerce.date(),
    seats: z.coerce.number().int().min(1).max(60).optional(),
    luggage: z.coerce.number().int().min(0).max(80).optional(),
    maxDetourMinutes: z.coerce.number().int().min(0).max(240).default(20),
    maxWaitMinutes: z.coerce.number().int().min(0).max(480).default(60),
    note: z.string().trim().max(500).optional().transform((v) => v || undefined),
  })
  .refine((d) => d.availableUntil > d.availableFrom, { message: "Ende muss nach dem Beginn liegen", path: ["availableUntil"] })
  .refine((d) => d.fromPlaceId !== d.toPlaceId, { message: "Start und Ziel müssen sich unterscheiden", path: ["toPlaceId"] });

/**
 * Veröffentlicht eine freie Kapazität bzw. geplante Rückfahrt. Sie startet immer als PLANNED:
 * erst die ausdrückliche Bestätigung macht sie zu verbindlicher Kapazität.
 */
export async function publishCapacity(actor: Actor | null, input: unknown) {
  requirePermission(actor, "capacity.publish");
  const data = parse(capacitySchema, input);
  let { vehicleCategory: category, seats, luggage } = data;
  if (data.vehicleId) {
    const v = await db.vehicle.findFirst({ where: { id: data.vehicleId, organizationId: actor.org.id, active: true } });
    if (!v) throw invalid("Fahrzeug nicht gefunden.");
    category ??= v.category;
    seats ??= v.seats;
    luggage ??= v.luggage;
  }
  if (!category || !seats || luggage == null) {
    throw invalid("Bitte Fahrzeug wählen oder Kategorie, Plätze und Gepäck angeben.");
  }
  if (data.availableUntil < new Date()) throw invalid("Der Zeitraum liegt in der Vergangenheit.");
  const offer = await db.capacityOffer.create({
    data: {
      organizationId: actor.org.id,
      createdById: actor.userId,
      vehicleId: data.vehicleId,
      vehicleCategory: category,
      fromPlaceId: data.fromPlaceId,
      toPlaceId: data.toPlaceId,
      availableFrom: data.availableFrom,
      availableUntil: data.availableUntil,
      seats,
      luggage,
      maxDetourMinutes: data.maxDetourMinutes,
      maxWaitMinutes: data.maxWaitMinutes,
      note: data.note,
    },
  });
  await audit(db, { actorUserId: actor.userId, organizationId: actor.org.id, action: "capacity.published", targetId: offer.id });
  return offer;
}

export async function setCapacityStatus(actor: Actor | null, offerId: string, status: "CONFIRMED" | "WITHDRAWN") {
  requirePermission(actor, "capacity.publish");
  const res = await db.capacityOffer.updateMany({
    where: { id: offerId, organizationId: actor.org.id, status: { not: "WITHDRAWN" } },
    data: { status },
  });
  if (res.count === 0) throw notFound();
  await audit(db, { actorUserId: actor.userId, organizationId: actor.org.id, action: `capacity.${status.toLowerCase()}`, targetId: offerId });
}

export async function listOwnCapacity(actor: Actor | null) {
  requirePermission(actor, "capacity.publish");
  return db.capacityOffer.findMany({
    where: { organizationId: actor.org.id, status: { not: "WITHDRAWN" }, availableUntil: { gt: new Date() } },
    orderBy: { availableFrom: "asc" },
    include: { vehicle: { select: { label: true } } },
  });
}

/** Freie Kapazitäten anderer Unternehmen (für Auftraggeber sichtbar, ohne Fahrzeugkennzeichen). */
export async function listMarketCapacity(actor: Actor | null) {
  requirePermission(actor, "org.read");
  return db.capacityOffer.findMany({
    where: {
      organizationId: { not: actor.org.id },
      status: { in: ["PLANNED", "CONFIRMED"] },
      availableUntil: { gt: new Date() },
      organization: { status: "ACTIVE", capabilities: { some: { capability: "TRANSPORT_PROVIDER", status: "VERIFIED" } } },
    },
    orderBy: { availableFrom: "asc" },
    take: 200,
    select: {
      id: true,
      vehicleCategory: true,
      fromPlaceId: true,
      toPlaceId: true,
      availableFrom: true,
      availableUntil: true,
      seats: true,
      luggage: true,
      maxDetourMinutes: true,
      maxWaitMinutes: true,
      status: true,
      note: true,
      organization: { select: { id: true, name: true, city: true } },
    },
  });
}
