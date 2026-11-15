import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission, type Actor } from "../authz/context";
import { parse } from "../validation";

/** Höchstzahl Geräte je Nutzer; das älteste fällt heraus. */
const MAX_DEVICES = 10;

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000).refine((u) => u.startsWith("https://"), "Ungültige Adresse."),
  keys: z.object({ p256dh: z.string().min(10).max(300), auth: z.string().min(10).max(100) }),
});

/** Schaltet Mitteilungen für dieses Gerät ein (oder frischt den Eintrag auf). Gilt für das aktive Unternehmen. */
export async function savePushSubscription(actor: Actor | null, sessionId: string | null, input: unknown) {
  requirePermission(actor, "org.read");
  const d = parse(subscriptionSchema, input);
  const data = { userId: actor.userId, organizationId: actor.org.id, sessionId, platform: "WEB" as const, p256dh: d.keys.p256dh, auth: d.keys.auth };
  await db.pushSubscription.upsert({ where: { endpoint: d.endpoint }, create: { endpoint: d.endpoint, ...data }, update: data });
  const old = await db.pushSubscription.findMany({ where: { userId: actor.userId }, orderBy: { createdAt: "desc" }, skip: MAX_DEVICES, select: { id: true } });
  if (old.length) await db.pushSubscription.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
}

export async function removePushSubscription(actor: Actor | null, endpoint: unknown) {
  requirePermission(actor, "org.read");
  if (typeof endpoint !== "string") return;
  await db.pushSubscription.deleteMany({ where: { endpoint, userId: actor.userId } });
}
