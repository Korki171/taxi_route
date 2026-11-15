import { AppError } from "@/server/errors";
import { getI18n } from "@/server/i18n";
import { takeFixedPriceRequest } from "@/server/services/marketplace";
import { getActor } from "@/server/web";

/**
 * „Übernehmen“ direkt aus der Mitteilung: der Service Worker ruft diese Adresse mit dem
 * Anmelde-Cookie des Geräts auf. Die Antwort ist der Text der Folgemitteilung.
 */
export async function POST(req: Request) {
  const { t } = await getI18n();
  // Nur Aufrufe von der eigenen Seite (Schutz vor fremden Formularen)
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return Response.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { requestId?: unknown } | null;
  const requestId = typeof body?.requestId === "string" ? body.requestId : "";
  const url = `/boerse/auftrag/${encodeURIComponent(requestId)}`;
  try {
    await takeFixedPriceRequest(await getActor(), requestId);
    return Response.json({ ok: true, title: t("Auftrag verbindlich übernommen."), body: t("Adressen und Fahrgastdaten finden Sie jetzt in der Buchung."), url });
  } catch (e) {
    if (e instanceof AppError) {
      const login = e.code === "UNAUTHENTICATED";
      return Response.json(
        { ok: false, title: t("Übernahme nicht möglich"), body: login ? t("Bitte melden Sie sich an, um den Auftrag zu übernehmen.") : t(e.message), url: login ? "/login" : url },
        { status: login ? 401 : 409 },
      );
    }
    throw e;
  }
}
