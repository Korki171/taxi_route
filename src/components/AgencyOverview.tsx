import Link from "next/link";
import { Load, Route } from "@/components/market";
import { Badge } from "@/components/ui";
import type { OrgActor } from "@/server/authz/context";
import { getI18n } from "@/server/i18n";
import { agencyOverview, transferState, type TransferRow } from "@/server/services/agency";
import { referenceOf } from "@/server/services/marketplace";

/**
 * Reisebüro-Dashboard: anstehende Transfers mit Stand, Suche nach Referenz oder Fahrgast,
 * Kennzahlen des Monats und die häufigsten Partner.
 */
export async function AgencyOverview({ actor, q }: { actor: OrgActor; q?: string }) {
  const { t, f } = await getI18n();
  const o = await agencyOverview(actor, { q });

  return (
    <>
      {o.attention.length > 0 && (
        <section className="card" aria-labelledby="attention">
          <h2 id="attention">{t("Braucht Ihre Aufmerksamkeit")}</h2>
          <ul className="steps">
            {o.attention.map((r) => (
              <li key={r.id}>
                <span>
                  <Route from={r.pickupPlaceId} to={r.dropoffPlaceId} href={`/boerse/auftrag/${r.id}`} />
                  <span className="price-note">
                    {f.dateTime(r.pickupAt)} ·{" "}
                    {r._count.quotes > 0
                      ? t("{n} Angebot(e), noch nicht vergeben", { n: r._count.quotes })
                      : r.quoteDeadline && r.quoteDeadline <= new Date()
                        ? t("Angebotsfrist abgelaufen, kein Angebot")
                        : t("Abholung bald, noch nicht vergeben")}
                  </span>
                </span>
                <Link href={`/boerse/auftrag/${r.id}`}>{r._count.quotes > 0 ? t("Angebote vergleichen") : t("Unternehmen anfragen")}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <div className="head-row">
          <h2>{t("Ihre Transfers der nächsten 14 Tage")}</h2>
          <form method="get" className="inline" role="search">
            <input type="search" name="q" defaultValue={q} placeholder={t("Referenz, TR-Nummer oder Fahrgast")} aria-label={t("Transfers suchen")} />
            <button type="submit" className="secondary">{t("Suchen")}</button>
          </form>
        </div>
        {o.found && (
          <>
            <h3 className="gap-top">{t("Suchergebnis für „{q}“", { q: q ?? "" })} {q && <Link href="/dashboard" className="price-note">{t("Suche zurücksetzen")}</Link>}</h3>
            {o.found.length === 0 ? <p className="empty">{t("Kein Transfer gefunden.")}</p> : <TransferTable rows={o.found} />}
            <h3 className="gap-top">{t("Anstehend")}</h3>
          </>
        )}
        {o.upcoming.length === 0 ? (
          <p className="empty">{t("Keine Transfers in den nächsten 14 Tagen.")} <Link href="/boerse/neu">{t("Auftrag einstellen")}</Link></p>
        ) : (
          <TransferTable rows={o.upcoming} />
        )}
      </section>

      <div className="grid">
        <section className="card">
          <h2>{t("Dieser Monat")}</h2>
          <dl className="kv">
            <dt>{t("Gebuchte Transfers")}</dt><dd>{o.month.bookings}</dd>
            <dt>{t("Vereinbarte Preise")}</dt><dd className="price-fixed">{f.money(o.month.spentCents)}</dd>
            {o.month.savedCents > 0 && <><dt>{t("Unter Ihrem Richtpreis")}</dt><dd>{f.money(o.month.savedCents)}</dd></>}
            {o.month.cancelled > 0 && <><dt>{t("Storniert")}</dt><dd>{o.month.cancelled}</dd></>}
          </dl>
          <p className="price-note">{t("Die Abrechnung erfolgt direkt mit dem ausführenden Unternehmen. Jede Buchung hat eine Auftragsbestätigung als PDF.")}</p>
        </section>

        <section className="card">
          <h2>{t("Ihre Partner")}</h2>
          {o.partners.length === 0 ? (
            <p className="empty">{t("Nach den ersten Buchungen sehen Sie hier, mit wem Sie am häufigsten fahren.")}</p>
          ) : (
            <ul className="steps">
              {o.partners.map((p) => (
                <li key={p.org.id}>
                  <span>
                    {p.org.name}
                    <span className="price-note">{t(p.trips === 1 ? "1 Fahrt mit Ihnen" : "{n} Fahrten mit Ihnen", { n: p.trips })} · {f.money(p.totalCents)}</span>
                  </span>
                  <Link href={`/boerse/neu?partner=${p.org.id}#anbieter`}>{t("Gezielt anfragen")}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

async function TransferTable({ rows }: { rows: TransferRow[] }) {
  const { t, f } = await getI18n();
  return (
    <div className="table-wrap">
      <table className="responsive">
        <thead>
          <tr><th>{t("Abholung")}</th><th>{t("Strecke")}</th><th>{t("Fahrgäste")}</th><th>{t("Ausführung")}</th><th className="num">{t("Preis")}</th><th>{t("Stand")}</th><th></th></tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const s = transferState(r);
            return (
              <tr key={r.id}>
                <td className="nowrap">{f.dateTime(r.pickupAt)}<span className="price-note">{referenceOf(r.number)}{r.clientReference ? ` · ${r.clientReference}` : ""}</span></td>
                <td><Route from={r.pickupPlaceId} to={r.dropoffPlaceId} href={`/boerse/auftrag/${r.id}`} />{r.flightNumber && <span className="price-note">{t("Flug")} {r.flightNumber}</span>}</td>
                <td data-label={t("Fahrgäste")}><Load passengers={r.passengers} luggage={r.luggage} ski={r.skiEquipment} /></td>
                <td data-label={t("Ausführung")}>
                  {r.booking ? r.booking.providerOrg.name : r.visibility === "INVITED" ? t("{n} angefragt", { n: r.invitations.length }) : <span className="muted">{t("Börse")}</span>}
                </td>
                <td className="num">{r.booking ? <span className="price-fixed">{f.money(r.booking.agreedPriceCents)}</span> : <span className="muted">{r.priceCents ? f.money(r.priceCents) : "–"}</span>}</td>
                <td>{r.status === "CANCELLED" || r.status === "COMPLETED" || r.status === "DISPUTED" ? <Badge status={r.status}>{t(r.status === "CANCELLED" ? "Storniert" : r.status === "COMPLETED" ? "Durchgeführt" : "Beanstandet")}</Badge> : <span className={`badge ${s.tone}`}>{t(s.label)}</span>}</td>
                <td className="nowrap">{r.booking ? <a href={`/api/bookings/${r.booking.id}/confirmation`} target="_blank" rel="noopener">{t("PDF")}</a> : null}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
