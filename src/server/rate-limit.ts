import { db } from "@/lib/db";
import { AppError } from "./errors";

/**
 * Zählt Versuche je Schlüssel in der Datenbank, damit das Limit auch über mehrere
 * Serverinstanzen (Vercel) hinweg gilt. Wirft bei Überschreitung, bevor gezählt wird.
 */
export async function rateLimit(key: string, max: number, windowMinutes: number) {
  const since = new Date(Date.now() - windowMinutes * 60_000);
  const count = await db.rateLimitHit.count({ where: { key, createdAt: { gt: since } } });
  if (count >= max) {
    throw new AppError("FORBIDDEN", "Zu viele Versuche. Bitte später erneut versuchen.");
  }
  await db.rateLimitHit.create({ data: { key } });
  // Gelegentlich alte Einträge entfernen.
  if (Math.random() < 0.02) {
    await db.rateLimitHit.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 3600_000) } } });
  }
}

export async function resetRateLimit(key: string) {
  await db.rateLimitHit.deleteMany({ where: { key } });
}
