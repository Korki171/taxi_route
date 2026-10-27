import { AppError } from "@/server/errors";
import { getI18n } from "@/server/i18n";
import { liveFleet, translateLive } from "@/server/services/dispatch";
import { getActor } from "@/server/web";

/** Lagebild für die Live-Karte; die Seite fragt es alle paar Sekunden neu ab. */
export async function GET() {
  try {
    const { t } = await getI18n();
    const data = translateLive(await liveFleet(await getActor()), t);
    return Response.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    if (e instanceof AppError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    }
    throw e;
  }
}
