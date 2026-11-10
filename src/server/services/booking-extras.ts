import { db } from "@/lib/db";
import { actorCan, requirePermission, type Actor, type OrgActor } from "../authz/context";
import { AppError, forbidden, invalid, notFound } from "../errors";
import { notificationFailed, notifyBookingReturned, notifyNewRequest } from "../notifications";
import { checkUpload, type UploadFile } from "./documents";
import { transferEvent } from "./transfer-events";

/** Höchstzahl Dokumente je Buchung */
export const MAX_BOOKING_DOCUMENTS = 10;

// ---------------------------------------------------------------------------
// Auftrag zurückgeben
// ---------------------------------------------------------------------------

/**
 * Das ausführende Unternehmen gibt einen übernommenen Auftrag zurück (Ablehnen nach der Annahme). Die
 * Buchung entfällt, der Auftrag ist wieder offen und wird erneut veröffentlicht; der Auftraggeber wird
 * informiert. Nur vor der Fahrt und vor der Abholzeit. Der Verlauf bleibt im Ereignisprotokoll.
 */
export async function returnBooking(actor: Actor | null, bookingId: string, reason: string) {
  requirePermission(actor, "jobs.accept");
  const r = reason.trim().slice(0, 500);
  if (!r) throw invalid("Bitte einen Grund für die Rückgabe angeben.");
  const b = await db.booking.findFirst({ where: { id: bookingId, providerOrgId: actor.org.id, status: "CONFIRMED" }, include: { request: true } });
  if (!b) throw notFound("Buchung nicht gefunden oder nicht mehr rückgabefähig.");
  if (b.request.pickupAt <= new Date()) throw invalid("Die Abholzeit ist bereits vorbei. Bitte stornieren Sie die Buchung.");
  await db.$transaction(async (tx) => {
    const del = await tx.booking.deleteMany({ where: { id: b.id, status: "CONFIRMED" } });
    if (del.count !== 1) throw invalid("Dieser Statuswechsel ist im aktuellen Zustand nicht möglich.");
    await tx.transferRequest.update({ where: { id: b.requestId }, data: { status: "OPEN", audienceSince: new Date(), ...(b.request.visibility === "MARKET" ? { audience: "MARKET" } : {}) } });
    await tx.quote.updateMany({ where: { requestId: b.requestId, providerOrgId: actor.org.id }, data: { status: "WITHDRAWN" } });
    await transferEvent(tx, b.requestId, "booking.returned", { userId: actor.userId, orgId: actor.org.id }, { note: r });
  });
  await notifyBookingReturned(b.requestId, actor.org.id, r).catch(notificationFailed);
  await notifyNewRequest(b.requestId, [actor.org.id]).catch(notificationFailed);
}

// ---------------------------------------------------------------------------
// Dokumente zur Buchung
// ---------------------------------------------------------------------------

async function participantBooking(actor: OrgActor, bookingId: string) {
  const b = await db.booking.findFirst({
    where: { id: bookingId, OR: [{ providerOrgId: actor.org.id }, { requesterOrgId: actor.org.id }] },
    select: { id: true, requestId: true, status: true },
  });
  if (!b) throw notFound();
  return b;
}

export async function uploadBookingDocument(actor: Actor | null, bookingId: string, title: string, file: UploadFile) {
  requirePermission(actor, "org.read");
  if (!actorCan(actor, "bookings.manage") && !actorCan(actor, "jobs.accept")) throw forbidden();
  const t = title.trim().slice(0, 160);
  if (!t) throw invalid("Bitte einen Titel angeben.");
  const b = await participantBooking(actor, bookingId);
  if (b.status === "CANCELLED") throw invalid("Zu stornierten Buchungen können keine Dokumente hochgeladen werden.");
  const fileName = checkUpload(file);
  if ((await db.bookingDocument.count({ where: { bookingId } })) >= MAX_BOOKING_DOCUMENTS) throw invalid("Höchstens 10 Dokumente je Buchung.");
  const doc = await db.bookingDocument.create({
    data: { bookingId, uploadedOrgId: actor.org.id, uploadedById: actor.userId, title: t, fileName, mimeType: file.mimeType, sizeBytes: file.bytes.byteLength, content: Buffer.from(file.bytes) },
    select: { id: true },
  });
  await transferEvent(db, b.requestId, "booking.document_added", { userId: actor.userId, orgId: actor.org.id }, { note: t });
  return doc;
}

export async function listBookingDocuments(actor: Actor | null, bookingId: string) {
  requirePermission(actor, "org.read");
  await participantBooking(actor, bookingId);
  return db.bookingDocument.findMany({
    where: { bookingId },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, fileName: true, mimeType: true, sizeBytes: true, uploadedOrgId: true, createdAt: true },
  });
}

/** Download nur für die beiden beteiligten Unternehmen. */
export async function getBookingDocumentForDownload(actor: Actor | null, documentId: string) {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Bitte melden Sie sich an.");
  requirePermission(actor, "org.read");
  const doc = await db.bookingDocument.findFirst({
    where: { id: documentId, booking: { OR: [{ providerOrgId: actor.org.id }, { requesterOrgId: actor.org.id }] } },
  });
  if (!doc) throw notFound();
  return doc;
}
