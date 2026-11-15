/**
 * Mitteilungen aufs Gerät: Web-Push für Browser und Web-App, Firebase Cloud Messaging (FCM) für die
 * native Fahrer-App (iOS und Android).
 *
 * Ohne FIREBASE_SERVICE_ACCOUNT (JSON des Dienstkontos) gehen keine Mitteilungen an die native App.
 * Ohne VAPID-Schlüssel (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY) wird nichts verschickt:
 * die Mitteilung landet im Postausgang `sentPushes` (für Tests und lokale Entwicklung), und die
 * Oberfläche bietet das Einschalten nicht an.
 */
import { createSign } from "node:crypto";
import type { MemberRole } from "@prisma/client";
import { sendNotification, setVapidDetails } from "web-push";
import { db } from "@/lib/db";
import { appUrl } from "./email";

export type PushMessage = {
  title: string;
  body: string;
  /** Seite, die ein Tipp auf die Mitteilung öffnet */
  url: string;
  /** Mitteilungen mit gleichem Kennzeichen ersetzen einander auf dem Gerät */
  tag?: string;
  /** Festpreis-Auftrag, der direkt aus der Mitteilung übernommen werden kann */
  takeRequestId?: string;
  actions?: { action: "take" | "open"; title: string }[];
};

/** `userIds`: nur an diese Personen (z. B. den zugewiesenen Fahrer); sonst an alle im Betrieb mit Geschäftsrolle. */
export type OrgPush = { orgId: string; message: PushMessage; userIds?: string[] };

export const sentPushes: (OrgPush & { userId: string; endpoint: string })[] = [];

/** Fahrer erhalten keine Mitteilungen zu Aufträgen und Buchungen des Betriebs (wie beim Zugriff in der App). */
const BUSINESS_ROLES: MemberRole[] = ["OWNER", "ADMIN", "DISPATCHER", "BOOKER"];

export function vapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY ? process.env.VAPID_PUBLIC_KEY : null;
}

// ---------------------------------------------------------------------------
// Native App: Firebase Cloud Messaging (HTTP v1), ohne SDK
// ---------------------------------------------------------------------------

type ServiceAccount = { project_id: string; client_email: string; private_key: string };

function serviceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const a = JSON.parse(raw) as ServiceAccount;
    return a.project_id && a.client_email && a.private_key ? a : null;
  } catch {
    console.error("FIREBASE_SERVICE_ACCOUNT ist kein gültiges JSON.");
    return null;
  }
}

export const nativePushConfigured = () => serviceAccount() !== null;

const b64url = (v: string | Buffer) => Buffer.from(v).toString("base64url");
let fcmToken: { value: string; expiresAt: number } | null = null;

async function fcmAccessToken(a: ServiceAccount) {
  if (fcmToken && fcmToken.expiresAt > Date.now() + 60_000) return fcmToken.value;
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify({
    iss: a.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }))}`;
  const jwt = `${unsigned}.${createSign("RSA-SHA256").update(unsigned).sign(a.private_key, "base64url")}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!res.ok) throw new Error(`FCM-Anmeldung fehlgeschlagen (${res.status})`);
  const body = (await res.json()) as { access_token: string; expires_in: number };
  fcmToken = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return fcmToken.value;
}

/** Nachricht im FCM-Format; Zusatzdaten sind dort nur Zeichenketten. */
export function fcmPayload(token: string, m: PushMessage) {
  return {
    message: {
      token,
      notification: { title: m.title, body: m.body },
      data: { url: m.url, ...(m.takeRequestId ? { takeRequestId: m.takeRequestId } : {}) },
      android: { priority: "HIGH", notification: { ...(m.tag ? { tag: m.tag } : {}) } },
      apns: { payload: { aps: { sound: "default" } } },
    },
  };
}

/** @returns "gone", wenn das Gerät die App nicht mehr hat */
async function sendFcm(a: ServiceAccount, token: string, m: PushMessage): Promise<"ok" | "gone"> {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${a.project_id}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await fcmAccessToken(a)}`, "Content-Type": "application/json" },
    body: JSON.stringify(fcmPayload(token, m)),
  });
  if (res.ok) return "ok";
  if (res.status === 404) return "gone";
  throw Object.assign(new Error(await res.text()), { statusCode: res.status });
}

let configured = false;
function configure() {
  const pub = vapidPublicKey();
  if (!pub) return false;
  if (!configured) {
    setVapidDetails(process.env.VAPID_SUBJECT ?? appUrl(), pub, process.env.VAPID_PRIVATE_KEY!);
    configured = true;
  }
  return true;
}

/**
 * Schickt jede Mitteilung an alle eingeschalteten Geräte des jeweiligen Unternehmens.
 * Fehler werden protokolliert und nie weitergeworfen; abgemeldete Geräte werden entfernt.
 */
export async function sendPushes(items: OrgPush[]): Promise<void> {
  if (items.length === 0) return;
  try {
    const orgIds = [...new Set(items.map((i) => i.orgId))];
    const [subs, members] = await Promise.all([
      db.pushSubscription.findMany({ where: { organizationId: { in: orgIds }, user: { status: "ACTIVE" } } }),
      db.membership.findMany({ where: { organizationId: { in: orgIds }, role: { in: BUSINESS_ROLES } }, select: { userId: true, organizationId: true } }),
    ]);
    const allowed = new Set(members.map((m) => `${m.userId}:${m.organizationId}`));
    const live = configure();
    const fcm = serviceAccount();
    const gone: string[] = [];
    const delivered: string[] = [];
    await Promise.all(
      items.flatMap((item) =>
        subs
          .filter((s) => s.organizationId === item.orgId && (item.userIds ? item.userIds.includes(s.userId) : allowed.has(`${s.userId}:${s.organizationId}`)))
          .map(async (s) => {
            const web = s.platform === "WEB";
            if (web ? !live || !s.p256dh || !s.auth : !fcm) {
              sentPushes.push({ ...item, userId: s.userId, endpoint: s.endpoint });
              if (sentPushes.length > 200) sentPushes.shift();
              return;
            }
            try {
              if (web) {
                await sendNotification(
                  { endpoint: s.endpoint, keys: { p256dh: s.p256dh!, auth: s.auth! } },
                  JSON.stringify(item.message),
                  { TTL: 3600, urgency: "high" },
                );
              } else if ((await sendFcm(fcm!, s.endpoint.replace(/^fcm:/, ""), item.message)) === "gone") {
                gone.push(s.id);
                return;
              }
              delivered.push(s.id);
            } catch (e) {
              const status = (e as { statusCode?: number }).statusCode;
              if (status === 404 || status === 410) gone.push(s.id);
              else console.error("Push fehlgeschlagen", status, (e as Error).message);
            }
          }),
      ),
    );
    if (gone.length) await db.pushSubscription.deleteMany({ where: { id: { in: gone } } });
    if (delivered.length) await db.pushSubscription.updateMany({ where: { id: { in: delivered } }, data: { lastSentAt: new Date() } });
  } catch (e) {
    console.error("Push fehlgeschlagen", e);
  }
}
