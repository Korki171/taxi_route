import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LangSwitch } from "@/components/LangSwitch";
import { Logo } from "@/components/Logo";
import { VEHICLE_LABEL } from "@/lib/labels";
import { placeName } from "@/lib/places";
import { getI18n } from "@/server/i18n";
import { sharedRequest } from "@/server/services/share";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

/** Vorschau in WhatsApp: Strecke und Zeit als Titel. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { t, f } = await getI18n();
  const r = await sharedRequest((await params).token);
  const base = { robots: { index: false, follow: false } };
  if (!r) return { title: "Transferborsa", ...base };
  const title = `${t(placeName(r.pickupPlaceId))} → ${t(placeName(r.dropoffPlaceId))}`;
  const description = [f.dateTime(r.pickupAt), t("{n} Personen", { n: r.passengers }), r.priceCents ? f.money(r.priceCents) : null].filter(Boolean).join(" · ");
  return { title: `${title} · Transferborsa`, description, openGraph: { title: t("Fahrt abzugeben: {route}", { route: title }), description, siteName: "Transferborsa" }, ...base };
}

/** Ein geteilter Auftrag, ohne Login (Zugang über den Teilen-Link). Übernehmen geht nach der Anmeldung in der Börse. */
export default async function SharedRequestPage({ params }: Props) {
  const { t, f } = await getI18n();
  const { token } = await params;
  const r = await sharedRequest(token);
  if (!r) notFound();
  const orderPath = `/boerse/auftrag/${r.id}`;
  return (
    <main className="legal track">
      <div className="legal-top">
        <Link href="/" className="wordmark" aria-label="Transferborsa"><Logo /></Link>
        <LangSwitch path={`/a/${token}`} />
      </div>
      <p className="sub">{r.open ? t("Fahrt abzugeben") : t("Diese Fahrt ist bereits vergeben")}</p>
      <h1>{t(placeName(r.pickupPlaceId))} <span className="muted">→</span> {t(placeName(r.dropoffPlaceId))}</h1>
      <section className="card">
        <dl className="kv">
          <dt>{t("Abholung")}</dt><dd>{f.dateTime(r.pickupAt)}</dd>
          <dt>{t("Fahrgäste")}</dt><dd>{t("{p} Pers. · {l} Gep.", { p: r.passengers, l: r.luggage })}</dd>
          {r.vehicleCategory && <><dt>{t("Fahrzeug")}</dt><dd>{t(VEHICLE_LABEL[r.vehicleCategory])}</dd></>}
          {r.priceCents != null && (
            <><dt>{r.priceMode === "FIXED" ? t("Festpreis") : t("Richtpreis")}</dt><dd className="price-fixed">{f.money(r.priceCents)}{r.handoffSharePercent > 0 && <span className="price-note">{t("{org} behält {p} % als Abgabe-Anteil", { org: r.company, p: r.handoffSharePercent })}</span>}</dd></>
          )}
          <dt>{t("Auftraggeber")}</dt><dd>{r.company}</dd>
          <dt>{t("Auftrag")}</dt><dd>{r.ref}</dd>
        </dl>
        {r.open ? (
          <>
            <div className="actions-row gap-top">
              <Link href={`/login?next=${encodeURIComponent(orderPath)}`} className="btn accent">{r.priceMode === "FIXED" ? t("Anmelden und übernehmen") : t("Anmelden und anbieten")}</Link>
              <Link href="/register" className="btn secondary">{t("Unternehmen registrieren")}</Link>
            </div>
            <p className="price-note">{t("Adressen und Fahrgastdaten sehen Sie nach der Übernahme. Übernehmen können geprüfte Taxi- und Transferunternehmen.")}</p>
          </>
        ) : (
          <div className="actions-row gap-top">
            <Link href="/boerse" className="btn secondary">{t("Weitere Fahrten in der Börse")}</Link>
          </div>
        )}
      </section>
    </main>
  );
}
