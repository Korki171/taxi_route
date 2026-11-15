import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Route } from "@/components/market";
import { Badge, Flash, Stars, type SP } from "@/components/ui";
import { QUOTE_STATUS_LABEL, TENDER_STATUS_LABEL, VEHICLE_LABEL } from "@/lib/labels";
import { routeGuide } from "@/lib/price-guide";
import { actorCan } from "@/server/authz/context";
import { AppError } from "@/server/errors";
import { getI18n } from "@/server/i18n";
import { ratingSummaries } from "@/server/services/ratings";
import { getTender, tenderReference } from "@/server/services/tenders";
import { requireOrgActor } from "@/server/web";
import { awardTenderAction, closeTenderAction, submitTenderBidAction, withdrawTenderBidAction } from "../../../actions";

export default async function TenderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const { t, f } = await getI18n();
  const { id } = await params;
  const sp = await searchParams;
  const actor = await requireOrgActor();
  const { role, tender: x, bids, open } = await getTender(actor, id).catch((e) => {
    if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
    throw e;
  });
  const myBid = role === "bidder" ? bids[0] : undefined;
  const winner = bids.find((b) => b.id === x.awardedBidId);
  const stars = await ratingSummaries([x.requesterOrg.id, ...bids.map((b) => b.providerOrgId)]);
  const guide = routeGuide(x.pickupPlaceId, x.dropoffPlaceId);
  const total = (cents: number) => f.money(cents * x.estimatedTrips);

  return (
    <AppShell actor={actor}>
      <p className="back"><Link href={`/boerse?view=${role === "requester" ? "meine-ausschreibungen" : "ausschreibungen"}`}>{t("← Ausschreibungen")}</Link></p>
      <div className="head-row">
        <div>
          <h1><Route from={x.pickupPlaceId} to={x.dropoffPlaceId} /></h1>
          <p className="sub">{tenderReference(x.number)} · {t("Ausschreibung")} · {f.date(x.dateFrom)} {t("bis")} {f.date(x.dateTo)}</p>
        </div>
        <Badge status={x.status === "OPEN" && !open ? "CLOSED" : x.status}>{t(x.status === "OPEN" && !open ? "Angebotsfrist vorbei" : TENDER_STATUS_LABEL[x.status])}</Badge>
      </div>
      <Flash searchParams={sp} />

      <div className="kv-grid">
        <section className="card">
          <h2>{t("Umfang")}</h2>
          <dl className="kv">
            <dt>{t("Fahrten")}</dt><dd>{t("etwa {n}", { n: x.estimatedTrips })}{x.bothDirections ? `, ${t("beide Richtungen")}` : ""}</dd>
            {guide && <><dt>{t("Strecke")}</dt><dd>{t("ca. {km} km, {time}", { km: guide.km, time: f.minutes(guide.minutes) })}</dd></>}
            {x.passengers && <><dt>{t("Personen je Fahrt")}</dt><dd>{x.passengers}</dd></>}
            <dt>{t("Fahrzeug")}</dt><dd>{x.vehicleCategory ? t(VEHICLE_LABEL[x.vehicleCategory]) : t("beliebig, passend zur Gruppe")}</dd>
            {x.notes && <><dt>{t("Hinweise")}</dt><dd>{x.notes}</dd></>}
            <dt>{t("Angebote bis")}</dt><dd>{f.date(x.bidDeadline)}</dd>
          </dl>
        </section>
        <section className="card">
          <h2>{t("Auftraggeber")}</h2>
          <dl className="kv">
            <dt>{t("Unternehmen")}</dt><dd>{x.requesterOrg.name}, {x.requesterOrg.city} <Stars rating={stars.get(x.requesterOrg.id)} /></dd>
            {x.requesterOrg.email && <><dt>{t("E-Mail")}</dt><dd>{x.requesterOrg.email}</dd></>}
            {x.requesterOrg.phone && <><dt>{t("Telefon")}</dt><dd>{x.requesterOrg.phone}</dd></>}
          </dl>
          {role === "bidder" && !x.requesterOrg.email && <p className="price-note">{t("Kontaktdaten sehen Sie nach dem Zuschlag.")}</p>}
        </section>
      </div>

      {role === "bidder" && (
        <section className="card stack">
          <h2>{myBid?.status === "SUBMITTED" ? t("Ihr Angebot ändern") : t("Angebot abgeben")}</h2>
          {myBid && <p className="flush"><Badge status={myBid.status}>{t(QUOTE_STATUS_LABEL[myBid.status])}</Badge> {t("{price} je Fahrt", { price: f.money(myBid.pricePerTripCents) })} · {t("zusammen etwa {total}", { total: total(myBid.pricePerTripCents) })}</p>}
          {myBid?.status === "ACCEPTED" && <p className="flash ok">{t("Sie haben den Zuschlag. Die einzelnen Fahrten erhalten Sie als Direktanfragen in der Börse.")}</p>}
          {open && actorCan(actor, "quotes.submit") && (
            <>
              <form action={submitTenderBidAction} className="stack">
                <input type="hidden" name="tenderId" value={x.id} />
                <div className="fields">
                  <label>{t("Ihr Festpreis je Fahrt in €")}<input name="price" inputMode="decimal" required defaultValue={myBid ? (myBid.pricePerTripCents / 100).toFixed(2).replace(".", ",") : ""} /></label>
                </div>
                <label>{t("Nachricht an den Auftraggeber")}{" "}<small>{t("optional")}</small><textarea name="message" rows={2} maxLength={500} defaultValue={myBid?.message ?? ""} /></label>
                <div><button type="submit" className="accent">{myBid?.status === "SUBMITTED" ? t("Angebot aktualisieren") : t("Angebot abgeben")}</button></div>
              </form>
              {myBid?.status === "SUBMITTED" && (
                <form action={withdrawTenderBidAction}>
                  <input type="hidden" name="tenderId" value={x.id} />
                  <button type="submit" className="link">{t("Angebot zurückziehen")}</button>
                </form>
              )}
              <p className="price-note">{t("Der Preis gilt für jede Fahrt im Zeitraum. Verbindlich wird er erst mit dem Zuschlag.")}</p>
            </>
          )}
        </section>
      )}

      {role === "requester" && (
        <section className="card stack">
          <h2>{t("Angebote vergleichen")}</h2>
          {bids.length === 0 ? <p className="empty">{t("Noch keine Angebote eingegangen.")}</p> : (
            <div className="table-wrap">
              <table className="responsive">
                <thead><tr><th>{t("Anbieter")}</th><th>{t("Nachricht")}</th><th className="num">{t("Preis je Fahrt")}</th><th>{t("Status")}</th><th></th></tr></thead>
                <tbody>
                  {bids.map((b, i) => (
                    <tr key={b.id} className={i === 0 && b.status === "SUBMITTED" ? "match" : undefined}>
                      <td>{b.providerOrg.name} <Stars rating={stars.get(b.providerOrgId)} /><span className="price-note">{b.providerOrg.city}{b.providerOrg.transportProfile?.fleetSize ? ` · ${t("{n} Fahrzeuge", { n: b.providerOrg.transportProfile.fleetSize })}` : ""} · {t("Konzession geprüft")}</span></td>
                      <td data-label={t("Nachricht")}>{b.message ?? <span className="muted">–</span>}</td>
                      <td className="num price-fixed">{f.money(b.pricePerTripCents)}<span className="price-note">{t("zusammen etwa {total}", { total: total(b.pricePerTripCents) })}</span></td>
                      <td><Badge status={b.status}>{t(QUOTE_STATUS_LABEL[b.status])}</Badge></td>
                      <td>
                        {x.status === "OPEN" && b.status === "SUBMITTED" && actorCan(actor, "bookings.manage") && (
                          <form action={awardTenderAction}>
                            <input type="hidden" name="tenderId" value={x.id} />
                            <input type="hidden" name="bidId" value={b.id} />
                            <button type="submit">{t("Zuschlag geben")}</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {winner && (
            <div className="stack">
              <p className="flush">{t("Vergeben an {org} für {price} je Fahrt.", { org: winner.providerOrg.name, price: f.money(winner.pricePerTripCents) })} {winner.providerOrg.phone} · {winner.providerOrg.email}</p>
              <div>
                <Link className="btn accent" href={`/boerse/neu?partner=${winner.providerOrgId}&from=${x.pickupPlaceId}&to=${x.dropoffPlaceId}&price=${(winner.pricePerTripCents / 100).toFixed(2).replace(".", ",")}`}>{t("Fahrt aus dieser Ausschreibung einstellen")}</Link>
              </div>
            </div>
          )}
          {x.status === "OPEN" && (
            <form action={closeTenderAction}>
              <input type="hidden" name="tenderId" value={x.id} />
              <button type="submit" className="danger">{t("Ausschreibung ohne Zuschlag beenden")}</button>
            </form>
          )}
        </section>
      )}
    </AppShell>
  );
}
