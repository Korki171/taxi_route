import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Auf Vercel läuft jede Funktionsinstanz mit eigenem Prisma-Pool. Der Supabase-Pooler im
 * Session-Modus erlaubt aber insgesamt nur 15 Verbindungen; mit Prismas Standard (mehrere
 * Verbindungen je Instanz) und der Live-Karte, die alle 10 Sekunden abfragt, war das schnell
 * aufgebraucht ("max clients reached"). Daher je Instanz nur eine Verbindung, sofern die
 * DATABASE_URL nichts anderes vorgibt.
 */
function datasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url || !process.env.VERCEL) return undefined;
  try {
    const u = new URL(url);
    if (!u.searchParams.has("connection_limit")) u.searchParams.set("connection_limit", "1");
    if (!u.searchParams.has("pool_timeout")) u.searchParams.set("pool_timeout", "20");
    return u.toString();
  } catch {
    return undefined;
  }
}

export const db = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: datasourceUrl() });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
