import { db } from "@/lib/db";
import { generateToken, hashToken } from "./tokens";

export const SESSION_COOKIE = "tr_session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 Tage
const RENEW_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 7;

/** Legt eine Session an und gibt das Klartext-Token (nur für das Cookie) zurück. */
export async function createSession(userId: string, activeOrgId: string | null) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({ data: { id: hashToken(token), userId, activeOrgId, expiresAt } });
  return { token, expiresAt };
}

/** Prüft ein Token. Abgelaufene Sessions und deaktivierte Nutzer werden abgewiesen. */
export async function validateSessionToken(token: string) {
  const id = hashToken(token);
  const session = await db.session.findUnique({ where: { id }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now() || session.user.status !== "ACTIVE") {
    await db.session.delete({ where: { id } }).catch(() => undefined);
    return null;
  }
  if (session.expiresAt.getTime() - Date.now() < RENEW_THRESHOLD_MS) {
    session.expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await db.session.update({ where: { id }, data: { expiresAt: session.expiresAt } });
  }
  return session;
}

export async function invalidateSession(token: string) {
  await db.session.deleteMany({ where: { id: hashToken(token) } });
}

export async function invalidateAllSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}
