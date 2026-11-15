import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LangSwitch } from "@/components/LangSwitch";
import { Logo } from "@/components/Logo";
import { TrackLive, type TrackText } from "@/components/TrackLive";
import { VEHICLE_LABEL } from "@/lib/labels";
import { getI18n } from "@/server/i18n";
import { trackingView } from "@/server/services/tracking";

export const metadata: Metadata = { title: "Live-Status · Transferborsa", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Live-Status einer Fahrt für Auftraggeber und Fahrgast, ohne Login (Zugang über geheimen Link). */
export default async function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { t, f, locale } = await getI18n();
  const { token } = await params;
  const v = await trackingView(token);
  if (!v) notFound();
  v.pickup.name = t(v.pickup.name);
  v.dropoff.name = t(v.dropoff.name);
  const text: TrackText = {
    state: {
      CONFIRMED: t("Fahrt bestätigt"),
      IN_PROGRESS: t("Fahrt läuft"),
      TO_PICKUP: t("Fahrer ist auf dem Weg zur Abholung"),
      AT_PICKUP: t("Fahrer wartet am Abholort"),
      ON_BOARD: t("Unterwegs zum Ziel"),
      COMPLETED: t("Fahrt durchgeführt"),
      CANCELLED: t("Fahrt storniert"),
      DISPUTED: t("Fahrt in Klärung"),
      NO_SHOW: t("Fahrgast nicht erschienen"),
    },
    eta: t("noch etwa {n} min"),
    updated: t("Stand {time}"),
    noPosition: t("Standort gerade nicht verfügbar"),
    pickup: t("Abholung"),
    dropoff: t("Ziel"),
    vehicle: t("Fahrzeug"),
  };
  return (
    <main className="legal track">
      <div className="legal-top">
        <Link href="/" className="wordmark" aria-label="Transferborsa"><Logo /></Link>
        <LangSwitch path={`/t/${token}`} />
      </div>
      <h1>{v.pickup.name} <span className="muted">→</span> {v.dropoff.name}</h1>
      <p className="sub">{t("Abholung")} {f.dateTime(new Date(v.pickupAt))} · {v.ref}</p>
      <TrackLive token={token} initial={v} text={text} locale={locale} />
      <section className="card">
        <dl className="kv">
          <dt>{t("Unternehmen")}</dt><dd>{v.company}</dd>
          {v.phone && <><dt>{t("Telefon")}</dt><dd><a href={`tel:${v.phone.replace(/[^+\d]/g, "")}`}>{v.phone}</a></dd></>}
          {v.driver && <><dt>{t("Fahrer")}</dt><dd>{v.driver}</dd></>}
          {(v.vehicle || v.plate) && <><dt>{t("Fahrzeug")}</dt><dd>{[v.vehicle, v.vehicleCategory ? t(VEHICLE_LABEL[v.vehicleCategory]) : null, v.plate].filter(Boolean).join(" · ")}</dd></>}
        </dl>
        <p className="price-note">{t("Der Standort wird nur während der Fahrt gezeigt. Zeiten sind Schätzungen.")}</p>
      </section>
    </main>
  );
}
