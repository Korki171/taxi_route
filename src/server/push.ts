/**
 * Mitteilungen aufs Gerät (Web-Push; die native App kommt über denselben Weg dazu).
 *
 * Ohne VAPID-Schlüssel (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY) wird nichts verschickt:
 * die Mitteilung landet im Postausgang `sentPushes` (für Tests und lokale Entwicklung), und die
 * Oberfläche bietet das Einschalten nicht an.
 */
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

export type OrgPush = { orgId: string; message: PushMessage };

export const sentPushes: (OrgPush & { userId: string; endpoint: string })[] = [];

/** Fahrer erhalten keine Mitteilungen zu Aufträgen und Buchungen des Betriebs (wie beim Zugriff in der App). */
const BUSINESS_ROLES: MemberRole[] = ["OWNER", "ADMIN", "DISPATCHER", "BOOKER"];

export function vapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY ? process.env.VAPID_PUBLIC_KEY : null;
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
    const gone: string[] = [];
    const delivered: string[] = [];
    await Promise.all(
      items.flatMap((item) =>
        subs
          .filter((s) => s.organizationId === item.orgId && allowed.has(`${s.userId}:${s.organizationId}`))
          .map(async (s) => {
            if (!live || s.platform !== "WEB" || !s.p256dh || !s.auth) {
              sentPushes.push({ ...item, userId: s.userId, endpoint: s.endpoint });
              if (sentPushes.length > 200) sentPushes.shift();
              return;
            }
            try {
              await sendNotification(
                { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                JSON.stringify(item.message),
                { TTL: 3600, urgency: "high" },
              );
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
