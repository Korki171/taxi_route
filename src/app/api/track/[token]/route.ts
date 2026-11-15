import { getI18n } from "@/server/i18n";
import { trackingView } from "@/server/services/tracking";

/** Stand der Fahrt für den Live-Status-Link; die Seite fragt ihn regelmäßig neu ab. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { t } = await getI18n();
  const view = await trackingView((await params).token);
  if (!view) return Response.json({ error: "not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  view.pickup.name = t(view.pickup.name);
  view.dropoff.name = t(view.dropoff.name);
  return Response.json(view, { headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" } });
}
