import { z } from "zod";
import { db } from "@/lib/db";
import { actorCan, requirePermission, type Actor } from "../authz/context";
import { AppError, invalid, notFound } from "../errors";
import { parse } from "../validation";
import { audit } from "./audit";

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

const ALLOWED: Record<string, (b: Uint8Array) => boolean> = {
  "application/pdf": (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46, // %PDF
  "image/png": (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
};

const metaSchema = z.object({
  type: z.enum([
    "BUSINESS_LICENSE",
    "TAXI_CONCESSION",
    "RENTAL_CAR_LICENSE",
    "INSURANCE",
    "COMMERCIAL_REGISTER",
    "OTHER",
  ]),
  title: z.string().trim().min(1).max(160),
  validUntil: z.coerce.date().optional(),
});

export type UploadFile = { name: string; mimeType: string; bytes: Uint8Array };

export async function uploadDocument(actor: Actor | null, meta: unknown, file: UploadFile) {
  requirePermission(actor, "documents.manage");
  const data = parse(metaSchema, meta);
  if (file.bytes.byteLength === 0) throw invalid("Die Datei ist leer.");
  if (file.bytes.byteLength > MAX_DOCUMENT_BYTES) throw invalid("Die Datei ist größer als 5 MB.");
  const check = ALLOWED[file.mimeType];
  // Inhalt prüfen, nicht nur den vom Browser gemeldeten Typ.
  if (!check || !check(file.bytes)) throw invalid("Erlaubt sind nur PDF-, PNG- und JPEG-Dateien.");

  const doc = await db.verificationDocument.create({
    data: {
      organizationId: actor.org.id,
      type: data.type,
      title: data.title,
      validUntil: data.validUntil ?? null,
      fileName: file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 200) || "dokument",
      mimeType: file.mimeType,
      sizeBytes: file.bytes.byteLength,
      content: Buffer.from(file.bytes),
      uploadedById: actor.userId,
    },
    select: { id: true, type: true, title: true, status: true },
  });
  await audit(db, {
    actorUserId: actor.userId,
    organizationId: actor.org.id,
    action: "document.uploaded",
    targetType: "VerificationDocument",
    targetId: doc.id,
    data: { type: doc.type },
  });
  return doc;
}

const listSelect = {
  id: true,
  type: true,
  title: true,
  fileName: true,
  mimeType: true,
  sizeBytes: true,
  validUntil: true,
  status: true,
  reviewNote: true,
  reviewedAt: true,
  createdAt: true,
} as const;

export async function listOwnDocuments(actor: Actor | null) {
  requirePermission(actor, "documents.read");
  return db.verificationDocument.findMany({
    where: { organizationId: actor.org.id },
    orderBy: { createdAt: "desc" },
    select: listSelect,
  });
}

/**
 * Download: nur Mitglieder der besitzenden Organisation mit documents.read
 * oder Plattformadmins. Andere Organisationen erhalten "nicht gefunden".
 */
export async function getDocumentForDownload(actor: Actor | null, documentId: string) {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Bitte melden Sie sich an.");
  const doc = await db.verificationDocument.findUnique({ where: { id: documentId } });
  if (!doc) throw notFound();
  const ownOrg = actor.org?.id === doc.organizationId && actorCan(actor, "documents.read");
  if (!ownOrg && !actor.isPlatformAdmin) throw notFound();
  return doc;
}

/** Nur ungeprüfte oder abgelehnte Dokumente dürfen gelöscht werden; geprüfte bleiben als Nachweis. */
export async function deleteDocument(actor: Actor | null, documentId: string) {
  requirePermission(actor, "documents.manage");
  const res = await db.verificationDocument.deleteMany({
    where: { id: documentId, organizationId: actor.org.id, status: { in: ["PENDING", "REJECTED"] } },
  });
  if (res.count === 0) throw notFound("Dokument nicht gefunden oder bereits geprüft.");
  await audit(db, {
    actorUserId: actor.userId,
    organizationId: actor.org.id,
    action: "document.deleted",
    targetId: documentId,
  });
}

export { listSelect as documentListSelect };
