import type { Capability } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission, type Actor } from "../authz/context";
import { invalid, notFound } from "../errors";
import { orgProfileSchema, parse, transportProfileSchema } from "../validation";
import { audit } from "./audit";
import { missingTransportDocuments } from "./verification-rules";

/** Vollständiges Profil der EIGENEN Organisation (inkl. interner Kontaktdaten). */
export async function getOwnOrganization(actor: Actor | null) {
  requirePermission(actor, "org.read");
  const org = await db.organization.findUnique({
    where: { id: actor.org.id },
    include: { capabilities: { orderBy: { capability: "asc" } }, transportProfile: true },
  });
  if (!org) throw notFound();
  return org;
}

export async function updateOrganizationProfile(actor: Actor | null, input: unknown) {
  requirePermission(actor, "org.update");
  const data = parse(orgProfileSchema, input);
  const nullable = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? null]));
  const org = await db.organization.update({ where: { id: actor.org.id }, data: nullable as typeof data });
  await audit(db, {
    actorUserId: actor.userId,
    organizationId: org.id,
    action: "organization.profile_updated",
    targetType: "Organization",
    targetId: org.id,
  });
  return org;
}

/**
 * Stammdaten des Beförderungsbetriebs. Bearbeitbar, sobald die Funktion beantragt ist –
 * auch vor der Verifizierung, damit die Prüfung überhaupt möglich ist.
 */
export async function updateTransportProfile(actor: Actor | null, input: unknown) {
  requirePermission(actor, "org.update");
  if (!(("TRANSPORT_PROVIDER" as Capability) in actor.org.capabilities)) {
    throw invalid("Ihre Organisation hat die Funktion Beförderungsunternehmen nicht beantragt.");
  }
  const data = parse(transportProfileSchema, input);
  const profile = await db.transportProfile.upsert({
    where: { organizationId: actor.org.id },
    create: { organizationId: actor.org.id, ...data },
    update: { ...data, fleetSize: data.fleetSize ?? null },
  });
  await audit(db, {
    actorUserId: actor.userId,
    organizationId: actor.org.id,
    action: "organization.transport_profile_updated",
  });
  return profile;
}

/**
 * Beantragt die Prüfung einer Geschäftsfunktion. Ein Reisebüro kann so zusätzlich
 * TRANSPORT_PROVIDER beantragen; nutzbar wird sie erst nach Freigabe durch den Admin.
 */
export async function requestCapabilityReview(actor: Actor | null, capability: Capability) {
  requirePermission(actor, "capabilities.request");
  const orgId = actor.org.id;
  const current = actor.org.capabilities[capability];
  if (current === "PENDING_REVIEW") throw invalid("Die Prüfung ist bereits beantragt.");
  if (current === "VERIFIED") throw invalid("Diese Funktion ist bereits verifiziert.");
  if (current === "SUSPENDED") {
    throw invalid("Diese Funktion wurde gesperrt. Bitte wenden Sie sich an den Support.");
  }

  if (capability === "TRANSPORT_PROVIDER") {
    const missing = await missingTransportDocuments(orgId, { includePending: true });
    if (missing.length) {
      throw invalid(`Bitte laden Sie zuerst folgende Nachweise hoch: ${missing.join(", ")}.`);
    }
  }

  const result = await db.$transaction(async (tx) => {
    const cap = await tx.organizationCapability.upsert({
      where: { organizationId_capability: { organizationId: orgId, capability } },
      create: { organizationId: orgId, capability, status: "PENDING_REVIEW" },
      update: { status: "PENDING_REVIEW", reviewNote: null, reviewedAt: null, reviewedById: null },
    });
    if (capability === "TRANSPORT_PROVIDER") {
      await tx.transportProfile.upsert({
        where: { organizationId: orgId },
        create: { organizationId: orgId, vehicleCategories: [], declaredRegions: [] },
        update: {},
      });
    }
    await audit(tx, {
      actorUserId: actor.userId,
      organizationId: orgId,
      action: "capability.review_requested",
      targetType: "OrganizationCapability",
      targetId: cap.id,
      data: { capability },
    });
    return cap;
  });
  return result;
}

/**
 * Öffentliches Kurzprofil einer (fremden) Organisation – nur die Angaben, die
 * Geschäftspartner für eine Anfrage brauchen. Keine Kontaktdaten, Dokumente,
 * Mitarbeiter oder Steuerdaten.
 */
export async function getPublicOrganizationProfile(actor: Actor | null, orgId: string) {
  requirePermission(actor, "org.read");
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      type: true,
      city: true,
      country: true,
      status: true,
      capabilities: { select: { capability: true, status: true } },
      transportProfile: { select: { vehicleCategories: true, declaredRegions: true } },
    },
  });
  // Gesperrte Organisationen werden nach außen nicht angezeigt.
  if (!org || org.status === "SUSPENDED") throw notFound();
  const { status: _status, ...rest } = org;
  return rest;
}
