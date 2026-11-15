import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission, type Actor } from "../authz/context";
import { parse } from "../validation";

/** Höchstzahl Geräte je Nutzer; das älteste fällt heraus. */
const MAX_DEVICES = 10;

/** Nur echte Push-Dienste der Browser, damit der Server keine beliebigen Adressen aufruft. */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /\.push\.services\.mozilla\.com$/, /^web\.push\.apple\.com$/, /\.notify\.windows\.com$/];

export function isPushServiceUrl(u: string): boolean {
  try {
    const url = new URL(u);
    return url.protocol === "https:" && !url.port && PUSH_HOSTS.some((h) => h.test(url.hostname));
  } catch {
    return false;
  }
}

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000).refine(isPushServiceUrl, "Ungültige Adresse."),
  keys: z.object({ p256dh: z.string().min(10).max(300), auth: z.string().min(10).max(100) }),
});

/** Native Fahrer-App: Geräte-Token von Firebase Cloud Messaging */
const nativeSchema = z.object({
  platform: z.enum(["ios", "android"]),
  token: z.string().min(20).max(4096).regex(/^[\w:.\-]+$/, "Ungültiges Token."),
});

/** Schaltet Mitteilungen für dieses Gerät ein (oder frischt den Eintrag auf). Gilt für das aktive Unternehmen. */
export async function savePushSubscription(actor: Actor | null, sessionId: string | null, input: unknown) {
  requirePermission(actor, "org.read");
  const base = { userId: actor.userId, organizationId: actor.org.id, sessionId };
  let endpoint: string;
  let data;
  if (input && typeof input === "object" && "token" in input) {
    const d = parse(nativeSchema, input);
    endpoint = `fcm:${d.token}`;
    data = { ...base, platform: d.platform === "ios" ? ("IOS" as const) : ("ANDROID" as const), p256dh: null, auth: null };
  } else {
    const d = parse(subscriptionSchema, input);
    endpoint = d.endpoint;
    data = { ...base, platform: "WEB" as const, p256dh: d.keys.p256dh, auth: d.keys.auth };
  }
  // Ein Gerät, das schon einem anderen Nutzer gehört, wird nicht umgehängt.
  const existing = await db.pushSubscription.findUnique({ where: { endpoint }, select: { userId: true } });
  if (existing && existing.userId !== actor.userId) return;
  await db.pushSubscription.upsert({ where: { endpoint }, create: { endpoint, ...data }, update: data });
  const old = await db.pushSubscription.findMany({ where: { userId: actor.userId }, orderBy: { createdAt: "desc" }, skip: MAX_DEVICES, select: { id: true } });
  if (old.length) await db.pushSubscription.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
}

export async function removePushSubscription(actor: Actor | null, endpoint: unknown) {
  requirePermission(actor, "org.read");
  if (typeof endpoint !== "string") return;
  await db.pushSubscription.deleteMany({ where: { endpoint, userId: actor.userId } });
}
