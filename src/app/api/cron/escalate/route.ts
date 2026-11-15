import { NextResponse } from "next/server";
import { escalateDueRequests } from "@/server/services/partners";
import { sendExpiryNotices } from "@/server/services/verification-rules";

export const dynamic = "force-dynamic";

/**
 * Gibt Aufträge, deren Frist ohne Übernahme abgelaufen ist, an die nächste Stufe weiter und
 * benachrichtigt den neuen Kreis. Aufgerufen alle 5 Minuten von GitHub Actions
 * (.github/workflows/weitergabe.yml), täglich vom Vercel-Cron und zusätzlich beim Öffnen der Börse.
 *
 * Der Aufruf ändert nur, was ohnehin fällig ist, und ist wiederholbar. Damit Fremde ihn nicht in
 * Dauerschleife aufrufen (Last, Kosten), verlangt er das Geheimnis CRON_SECRET, sobald es gesetzt ist.
 * Vercel-Cron schickt es von selbst mit; GitHub Actions liest es aus dem Repository-Secret CRON_SECRET.
 */
async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Nicht erlaubt." }, { status: 401 });
  }
  return NextResponse.json({ escalated: await escalateDueRequests() }, { headers: { "Cache-Control": "no-store" } });
async function run() {
  const escalated = await escalateDueRequests();
  // Ablaufwarnungen für Nachweise (jede Stufe geht nur einmal raus)
  const expiryNotices = await sendExpiryNotices().catch(() => 0);
  return NextResponse.json({ escalated, expiryNotices }, { headers: { "Cache-Control": "no-store" } });
}

export const GET = run;
export const POST = run;
