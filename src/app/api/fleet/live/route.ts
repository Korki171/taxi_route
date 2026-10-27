import { AppError } from "@/server/errors";
import { getI18n } from "@/server/i18n";
import { liveFleet } from "@/server/services/dispatch";
import { getActor } from "@/server/web";

/** Lagebild für die Live-Karte; die Seite fragt es alle paar Sekunden neu ab. */
export async function GET() {
  try {
    const { t } = await getI18n();
    const data = await liveFleet(await getActor());
    for (const v of data.vehicles) {
      if (v.trip) {
        v.trip.pickup.name = t(v.trip.pickup.name);
        v.trip.dropoff.name = t(v.trip.dropoff.name);
      }
    }
    return Response.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    if (e instanceof AppError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    }
    throw e;
  }
}
