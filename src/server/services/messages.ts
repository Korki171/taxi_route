import { z } from "zod";
import { db } from "@/lib/db";
import { isPlaceId } from "@/lib/places";
import { actorCan, requirePermission, type Actor, type OrgActor } from "../authz/context";
import { forbidden, invalid, notFound } from "../errors";
import { notificationFailed, notifyNewMessage } from "../notifications";
import { rateLimit } from "../rate-limit";
import { parse } from "../validation";
import { audit } from "./audit";
import { VISIBLE_TO } from "./visibility";

export const MAX_MESSAGE_LENGTH = 1000;

const canWrite = (actor: OrgActor) => actorCan(actor, "jobs.accept") || actorCan(actor, "transfers.request") || actorCan(actor, "bookings.manage");

/**
 * Wer darf zu einem Auftrag schreiben? Der Auftraggeber mit dem ausführenden Unternehmen, mit angefragten
 * Unternehmen und mit jedem, das bereits geschrieben hat. Jedes andere Unternehmen schreibt nur dem Auftraggeber,
 * solange der Auftrag für es sichtbar ist (Rückfrage) oder es den Auftrag übernommen hat.
 */
async function access(actor: OrgActor, requestId: string) {
  const req = await db.transferRequest.findUnique({
    where: { id: requestId },
    select: { id: true, status: true, requesterOrgId: true, booking: { select: { providerOrgId: true } }, invitations: { select: { providerOrgId: true } } },
  });
  if (!req) throw notFound();
  if (req.requesterOrgId === actor.org.id) {
    const written = await db.message.findMany({ where: { requestId }, distinct: ["threadOrgId"], select: { threadOrgId: true } });
    const allowed = new Set([...written.map((w) => w.threadOrgId), ...req.invitations.map((i) => i.providerOrgId), ...(req.booking ? [req.booking.providerOrgId] : [])]);
    allowed.delete(actor.org.id);
    return { req, role: "requester" as const, allowed };
  }
  const isProvider = req.booking?.providerOrgId === actor.org.id;
  const ownThread = (await db.message.count({ where: { requestId, threadOrgId: actor.org.id } })) > 0;
  const visible = req.status === "OPEN" && actorCan(actor, "jobs.accept") && (await db.transferRequest.count({ where: { id: requestId, ...VISIBLE_TO(actor.org.id) } })) === 1;
  if (!isProvider && !visible && !ownThread) throw notFound();
  return { req, role: "counterpart" as const, allowed: new Set([actor.org.id]), canStart: isProvider || visible };
}

export async function sendMessage(actor: Actor | null, requestId: string, input: unknown) {
  requirePermission(actor, "org.read");
  if (!canWrite(actor)) throw forbidden();
  const d = parse(z.object({ body: z.string().trim().min(1, "Bitte eine Nachricht eingeben").max(MAX_MESSAGE_LENGTH), threadOrgId: z.string().max(40).optional() }), input);
  const a = await access(actor, requestId);
  let threadOrgId: string;
  if (a.role === "requester") {
    if (!d.threadOrgId || !a.allowed.has(d.threadOrgId)) throw invalid("Bitte ein Unternehmen für die Nachricht wählen.");
    threadOrgId = d.threadOrgId;
  } else {
    if (!a.canStart && (await db.message.count({ where: { requestId, threadOrgId: actor.org.id } })) === 0) throw notFound();
    threadOrgId = actor.org.id;
  }
  await rateLimit(`msg:${actor.org.id}`, 40, 60);
  const msg = await db.message.create({ data: { requestId, threadOrgId, senderOrgId: actor.org.id, senderUserId: actor.userId, body: d.body } });
  await notifyNewMessage(msg.id).catch(notificationFailed);
  return msg;
}

/** Verläufe zum Auftrag: für den Auftraggeber je Gegenüber, sonst der eigene Verlauf. */
export async function listThreads(actor: Actor | null, requestId: string) {
  requirePermission(actor, "org.read");
  const a = await access(actor, requestId);
  const messages = await db.message.findMany({
    where: { requestId, ...(a.role === "counterpart" ? { threadOrgId: actor.org.id } : {}) },
    orderBy: { createdAt: "asc" },
    select: { id: true, threadOrgId: true, senderOrgId: true, body: true, createdAt: true },
    take: 500,
  });
  const orgIds = [...new Set([...a.allowed, ...messages.map((m) => m.threadOrgId)])].filter((id) => id !== actor.org.id);
  const names = new Map((await db.organization.findMany({ where: { id: { in: [...orgIds, actor.org.id] } }, select: { id: true, name: true } })).map((o) => [o.id, o.name]));
  const threadIds = a.role === "requester" ? orgIds : [actor.org.id];
  const threads = threadIds.map((id) => ({
    threadOrgId: id,
    withName: a.role === "requester" ? names.get(id) ?? "" : null,
    messages: messages.filter((m) => m.threadOrgId === id),
  }));
  return { role: a.role, canWrite: canWrite(actor), names, threads: threads.filter((t) => a.role === "counterpart" ? a.canStart || t.messages.length > 0 : true) };
}

// ---------------------------------------------------------------------------
// Suchagent: E-Mail bei neuen Aufträgen
// ---------------------------------------------------------------------------

const alertSchema = z.object({
  mailNewJobs: z.boolean(),
  from: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().refine(isPlaceId, "Unbekannter Ort").optional()),
  to: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().refine(isPlaceId, "Unbekannter Ort").optional()),
});

export async function updateJobAlerts(actor: Actor | null, input: unknown) {
  requirePermission(actor, "org.update");
  const d = parse(alertSchema, input);
  await db.organization.update({ where: { id: actor.org.id }, data: { mailNewJobs: d.mailNewJobs, alertFromPlaceId: d.from ?? null, alertToPlaceId: d.to ?? null } });
  await audit(db, { actorUserId: actor.userId, organizationId: actor.org.id, action: "organization.job_alerts_updated", targetType: "Organization", targetId: actor.org.id });
}
