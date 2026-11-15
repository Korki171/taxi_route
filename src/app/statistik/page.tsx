import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Route } from "@/components/market";
import { type SP } from "@/components/ui";
import { fmtMinutes } from "@/lib/format";
import { getI18n } from "@/server/i18n";
import { STAT_PERIODS, orgStats } from "@/server/services/stats";
import { requireOrgActor } from "@/server/web";

export default async function StatsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const actor = await requireOrgActor();
  const { t, f } = await getI18n();
  const s = await orgStats(actor, Number(sp.tage) || 90);

  const figures = [
    { n: String(s.takenTrips), label: t("Fahrten übernommen und gefahren") },
    { n: f.money(s.takenRevenueCents), label: t("Umsatz aus übernommenen Fahrten") },
    { n: String(s.givenAway), label: t("eigene Aufträge abgegeben") },
    { n: s.takenRate == null ? "–" : `${s.takenRate} %`, label: t("der eingestellten Aufträge wurden übernommen") },
  ];

  return (
    <AppShell actor={actor}>
      <p className="back"><Link href="/dashboard">← {t("Übersicht")}</Link></p>
      <div className="head-row">
        <h1>{t("Auswertung")}</h1>
        <p className="period">
          {STAT_PERIODS.map((d) => (
            <Link key={d} href={`/statistik?tage=${d}`} className={d === s.days ? "btn" : "btn secondary"} aria-current={d === s.days ? "page" : undefined}>
              {d === 365 ? t("12 Monate") : t("{n} Tage", { n: d })}
            </Link>
          ))}
        </p>
      </div>

      <section className="band" aria-label={t("Auswertung")}>
        <ul className="band-figures">
          {figures.map((x) => (
            <li key={x.label}><span className="fig">{x.n}</span><span className="fig-label">{x.label}</span></li>
          ))}
        </ul>
      </section>

      <div className="split">
        <section className="card">
          <h2>{t("Abgeben und Übernehmen")}</h2>
          <dl className="kv">
            <dt>{t("Aufträge eingestellt")}</dt><dd>{s.posted}</dd>
            <dt>{t("Zeit bis zur Übernahme")}</dt><dd>{s.medianTakeMinutes == null ? "–" : `${fmtMinutes(s.medianTakeMinutes)} (${t("Median")})`}</dd>
            <dt>{t("Abgegebene Fahrten gefahren")}</dt><dd>{s.handedTrips}</dd>
            <dt>{t("Ihr Abgabe-Anteil daraus")}</dt><dd>{f.money(s.handedShareCents)}</dd>
            <dt>{t("Storniert oder nicht erschienen")}</dt><dd>{s.cancelled}</dd>
          </dl>
        </section>
        <section className="card">
          <h2>{t("Häufigste Strecken")}</h2>
          {s.topRoutes.length === 0 ? (
            <p className="empty">{t("Noch keine abgeschlossenen Fahrten in diesem Zeitraum.")}</p>
          ) : (
            <table className="responsive">
              <thead><tr><th>{t("Strecke")}</th><th className="num">{t("Fahrten")}</th><th className="num">{t("Preis im Schnitt")}</th></tr></thead>
              <tbody>
                {s.topRoutes.map((r) => (
                  <tr key={r.pickupPlaceId + r.dropoffPlaceId}>
                    <td><Route from={r.pickupPlaceId} to={r.dropoffPlaceId} /></td>
                    <td className="num">{r.trips}</td>
                    <td className="num">{f.money(r.avgPriceCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </AppShell>
  );
}
