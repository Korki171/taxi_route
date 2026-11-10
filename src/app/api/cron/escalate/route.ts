import { NextResponse } from "next/server";
import { escalateDueRequests } from "@/server/services/partners";

export const dynamic = "force-dynamic";

/** Täglicher Vercel-Cron: gibt überfällige Aufträge an die nächste Stufe weiter (zusätzlich zum Aufruf beim Öffnen der Börse). */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ escalated: await escalateDueRequests() });
}
