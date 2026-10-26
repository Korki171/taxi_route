import type { Capability, OrganizationStatus, OrganizationType, VerificationStatus } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePlatformAdmin, type Actor } from "../authz/context";
import { invalid, notFound } from "../errors";
import { parse } from "../validation";
import { audit } from "./audit";
import { documentListSelect } from "./documents";
import { missingTransportDocuments } from "./verification-rules";

export async function adminListOrganizations(
  actor: Actor | null,
  filter: { q?: string; type?: OrganizationType; capabilityStatus?: VerificationStatus } = {},
) {
  requirePlatformAdmin(actor);
  return db.organization.findMany({
    where: {
      type: filter.type,
      name: filter.q ? { contains: filter.q, mode: "insensitive" } : undefined,
      capabilities: filter.capabilityStatus ? { some: { status: filter.capabilityStatus } } : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { capabilities: true, _count: { select: { memberships: true, documents: true } } },
  });
}

export async function adminGetOrganization(actor: Actor | null, orgId: string) {
  requirePlatformAdmin(actor);
  const org = await db.organization.findUnique({
    where: { id: orgId },
    include: {
      capabilities: { orderBy: { capability: "asc" } },
      transportProfile: true,
      documents: { orderBy: { createdAt: "desc" }, select: documentListSelect },
      memberships: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, user: { select: { id: true, name: true, email: true, status: true } } },
      },
      auditEvents: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!org) throw notFound();
  return org;
}

const reviewSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED", "SUSPENDED"]),
  note: z.string().trim().max(1000).optional(),
});

/**
 * Prüfentscheidung über eine Geschäftsfunktion. Für TRANSPORT_PROVIDER ist die
 * Freigabe nur mit geprüfter Konzession und Versicherung möglich.
 */
export async function adminReviewCapability(
  actor: Actor | null,
  orgId: string,
  capability: Capability,
  input: unknown,
) {
  requirePlatformAdmin(actor);
  const { status, note } = parse(reviewSchema, input);
  const cap = await db.organizationCapability.findUnique({
    where: { organizationId_capability: { organizationId: orgId, capability } },
  });
  if (!cap) throw notFound("Diese Funktion wurde von der Organisation nicht beantragt.");
  if (status === "VERIFIED" && capability === "TRANSPORT_PROVIDER") {
    const missing = await missingTransportDocuments(orgId, { includePending: false });
    if (missing.length) throw invalid(`Freigabe nicht möglich, es fehlen geprüfte Nachweise: ${missing.join(", ")}.`);
  }
  return db.$transaction(async (tx) => {
    const updated = await tx.organizationCapability.update({
      where: { id: cap.id },
      data: { status, reviewNote: note ?? null, reviewedById: actor.userId, reviewedAt: new Date() },
    });
    await audit(tx, {
      actorUserId: actor.userId,
      organizationId: orgId,
      action: "capability.reviewed",
      targetType: "OrganizationCapability",
      targetId: cap.id,
      data: { capability, from: cap.status, to: status, note: note ?? null },
    });
    return updated;
  });
}

export async function adminReviewDocument(actor: Actor | null, documentId: string, input: unknown) {
  requirePlatformAdmin(actor);
  const { status, note } = parse(
    z.object({ status: z.enum(["APPROVED", "REJECTED"]), note: z.string().trim().max(1000).optional() }),
    input,
  );
  const doc = await db.verificationDocument.findUnique({
    where: { id: documentId },
    select: { id: true, organizationId: true, status: true, type: true },
  });
  if (!doc) throw notFound();
  return db.$transaction(async (tx) => {
    const updated = await tx.verificationDocument.update({
      where: { id: doc.id },
      data: { status, reviewNote: note ?? null, reviewedById: actor.userId, reviewedAt: new Date() },
      select: { id: true, status: true },
    });
    await audit(tx, {
      actorUserId: actor.userId,
      organizationId: doc.organizationId,
      action: "document.reviewed",
      targetType: "VerificationDocument",
      targetId: doc.id,
      data: { type: doc.type, from: doc.status, to: status },
    });
    return updated;
  });
}

export async function adminSetOrganizationStatus(
  actor: Actor | null,
  orgId: string,
  status: OrganizationStatus,
  note?: string,
) {
  requirePlatformAdmin(actor);
  const parsed = parse(z.enum(["ACTIVE", "RESTRICTED", "SUSPENDED"]), status);
  const org = await db.organization.findUnique({ where: { id: orgId }, select: { status: true } });
  if (!org) throw notFound();
  return db.$transaction(async (tx) => {
    const updated = await tx.organization.update({ where: { id: orgId }, data: { status: parsed } });
    await audit(tx, {
      actorUserId: actor.userId,
      organizationId: orgId,
      action: "organization.status_changed",
      data: { from: org.status, to: parsed, note: note ?? null },
    });
    return updated;
  });
}
