import { NextResponse } from "next/server";
import { escalateDueRequests } from "@/server/services/partners";
import { sendExpiryNotices } from "@/server/services/verification-rules";

export const dynamic = "force-dynamic";

/**
 * Gibt Aufträge, deren Frist ohne Übernahme abgelaufen ist, an die nächste Stufe weiter und
 * benachrichtigt den neuen Kreis. Aufgerufen alle 5 Minuten von GitHub Actions
 * (.github/workflows/weitergabe.yml), täglich vom Vercel-Cron und zusätzlich beim Öffnen der Börse.
 *
 * Bewusst ohne Geheimnis: der Aufruf ändert nur, was ohnehin fällig ist, ist wiederholbar und
 * liest höchstens 200 Aufträge. Ein fremder Aufruf kann nichts vorziehen oder verraten.
 */
async function run() {
  const escalated = await escalateDueRequests();
  // Ablaufwarnungen für Nachweise (jede Stufe geht nur einmal raus)
  const expiryNotices = await sendExpiryNotices().catch(() => 0);
  return NextResponse.json({ escalated, expiryNotices }, { headers: { "Cache-Control": "no-store" } });
}

export const GET = run;
export const POST = run;
