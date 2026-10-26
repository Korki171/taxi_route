import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Empty, Load, PlaceSelect, Route, VehicleSelect } from "@/components/market";
import { Badge, Flash, type SP } from "@/components/ui";
import { fmtDateTime, fmtMinutes, fmtTime } from "@/lib/format";
import {
  BOOKING_STATUS_LABEL,
  CAPACITY_STATUS_LABEL,
  QUOTE_STATUS_LABEL,
  TRANSFER_STATUS_LABEL,
  VEHICLE_LABEL,
} from "@/lib/labels";
import { formatCents } from "@/lib/money";
import { REGION_LABEL, placeName } from "@/lib/places";
import { actorCan, type OrgActor } from "@/server/authz/context";
import { listMarketCapacity } from "@/server/services/fleet";
import {
  listBookings,
  listIncomingQuotes,
  listOwnQuotes,
  listOwnRequests,
  referenceOf,
  searchBoard,
} from "@/server/services/marketplace";
import { listCapacityWithMatches } from "@/server/services/matching";
import { requireOrgActor } from "@/server/web";
import { setCapacityStatusAction } from "../actions";
import { getI18n } from "@/server/i18n";

type View = { id: string; label: string; allowed: (a: OrgActor) => boolean };

const VIEWS: View[] = [
  { id: "markt", label: "Passende Aufträge", allowed: (a) => actorCan(a, "jobs.accept") },
  { id: "neu", label: "Neue Aufträge", allowed: (a) => actorCan(a, "jobs.accept") },
  { id: "kapazitaeten", label: "Freie Kapazitäten", allowed: (a) => actorCan(a, "transfers.request") || actorCan(a, "jobs.accept") },
  { id: "rueckfahrten", label: "Passende Rückfahrten", allowed: (a) => actorCan(a, "capacity.publish") },
  { id: "meine", label: "Eigene Aufträge", allowed: (a) => actorCan(a, "transfers.request") },
  { id: "angebote", label: "Angebote", allowed: (a) => actorCan(a, "bookings.manage") || actorCan(a, "quotes.submit") },
  { id: "uebernommen", label: "Übernommene Aufträge", allowed: (a) => actorCan(a, "jobs.accept") },
  { id: "fahrten", label: "Laufend und abgeschlossen", allowed: () => true },
  { id: "probleme", label: "Storniert oder beanstandet", allowed: () => true },
];

const FILTER_KEYS = ["from", "to", "fromRegion", "toRegion", "country", "dateFrom", "dateTo", "vehicleCategory", "minPassengers", "maxPassengers", "maxPrice", "priceMode"];

async function PriceCell({ mode, cents }: { mode: "FIXED" | "NEGOTIABLE"; cents: number | null }) {
  const { t, f } = await getI18n();
  return mode === "FIXED" ? (
    <span className="price-fixed">{f.money(cents)}<span className="price-note">{t("Festpreis")}</span></span>
  ) : (
    <span className="price-guide"><strong>{cents ? f.money(cents) : "offen"}</strong><span className="price-note">{t("Richtpreis, verhandelbar")}</span></span>
  );
}

export default async function BoersePage({ searchParams }: { searchParams: SP }) {
  const { t, f } = await getI18n();
  const sp = await searchParams;
  const actor = await requireOrgActor();
  const views = VIEWS.filter((v) => v.allowed(actor));
  if (views.length === 0) redirect("/dashboard");
  const view = views.find((v) => v.id === sp.view) ?? views[0];

  return (
    <AppShell actor={actor}>
      <div className="head-row">
        <div>
          <h1>{t("Auftragsbörse")}</h1>
          <p className="sub">{t("Transferaufträge, Angebote und freie Kapazitäten zwischen geprüften Unternehmen")}</p>
        </div>
        <div className="inline">
          {actorCan(actor, "transfers.request") && <Link href="/boerse/neu"><button type="button">{t("Auftrag einstellen")}</button></Link>}
          {actorCan(actor, "capacity.publish") && <Link href="/flotte#fahrt"><button type="button" className="secondary">{t("Rückfahrt anbieten")}</button></Link>}
        </div>
      </div>
      <Flash searchParams={sp} />
      <nav className="tabs" aria-label={t("Ansichten der Börse")}>
        {views.map((v) => (
          <Link key={v.id} href={`/boerse?view=${v.id}`} aria-current={v.id === view.id ? "page" : undefined}>{t(v.label)}</Link>
        ))}
      </nav>
      {view.id === "markt" && <MarketView actor={actor} sp={sp} />}
      {view.id === "neu" && <MarketView actor={actor} sp={{ ...sp, newOnly: "1" }} />}
      {view.id === "kapazitaeten" && <CapacityMarketView actor={actor} />}
      {view.id === "rueckfahrten" && <ReturnTripsView actor={actor} />}
      {view.id === "meine" && <OwnRequestsView actor={actor} />}
      {view.id === "angebote" && <QuotesView actor={actor} />}
      {view.id === "uebernommen" && <BookingsView actor={actor} side="provider" statuses={["CONFIRMED"]} title={t("Übernommene Aufträge, noch nicht gefahren")} />}
      {view.id === "fahrten" && <BookingsView actor={actor} side="both" statuses={["IN_PROGRESS", "COMPLETED"]} title={t("Laufende und abgeschlossene Fahrten")} />}
      {view.id === "probleme" && <BookingsView actor={actor} side="both" statuses={["CANCELLED", "DISPUTED"]} title={t("Stornierte oder beanstandete Buchungen")} />}
    </AppShell>
  );
}

async function MarketView({ actor, sp }: { actor: OrgActor; sp: Record<string, string | undefined> }) {
  const { t, f } = await getI18n();
  const filter = Object.fromEntries(FILTER_KEYS.map((k) => [k, sp[k] ?? ""]));
  const maxPriceCents = sp.maxPrice ? String(Math.round(Number(sp.maxPrice) * 100)) : "";
  const rows = await searchBoard(actor, { ...filter, maxPrice: maxPriceCents, newOnly: sp.newOnly });
  const active = FILTER_KEYS.some((k) => sp[k]);
  return (
    <>
      <form className="card filters" method="get" aria-label={t("Filter")}>
        <input type="hidden" name="view" value={sp.newOnly ? "neu" : "markt"} />
        <label>{t("Von")}<PlaceSelect name="from" defaultValue={sp.from} emptyLabel={t("Alle Orte")} /></label>
        <label>{t("Nach")}<PlaceSelect name="to" defaultValue={sp.to} emptyLabel={t("Alle Orte")} /></label>
        <label>{t("Region Start")}
          <select name="fromRegion" defaultValue={sp.fromRegion ?? ""}>
            <option value="">{t("Alle")}</option>
            {Object.entries(REGION_LABEL).map(([k, v]) => <option key={k} value={k}>{t(v)}</option>)}
          </select>
        </label>
        <label>{t("Region Ziel")}
          <select name="toRegion" defaultValue={sp.toRegion ?? ""}>
            <option value="">{t("Alle")}</option>
            {Object.entries(REGION_LABEL).map(([k, v]) => <option key={k} value={k}>{t(v)}</option>)}
          </select>
        </label>
        <label>{t("Land")}
          <select name="country" defaultValue={sp.country ?? ""}>
            <option value="">{t("Alle")}</option>
            <option value="AT">{t("Österreich")}</option><option value="DE">{t("Deutschland")}</option>
            <option value="IT">{t("Italien")}</option><option value="CH">{t("Schweiz")}</option>
          </select>
        </label>
        <label>{t("Ab Datum")}<input type="date" name="dateFrom" defaultValue={sp.dateFrom} /></label>
        <label>{t("Bis Datum")}<input type="date" name="dateTo" defaultValue={sp.dateTo} /></label>
        <label>{t("Mein Fahrzeug")}<VehicleSelect name="vehicleCategory" defaultValue={sp.vehicleCategory} emptyLabel={t("Alle")} /></label>
        <label>{t("Max. Personen")}<input type="number" min={1} name="maxPassengers" defaultValue={sp.maxPassengers} /></label>
        <label>{t("Preis bis (€)")}<input type="number" min={0} name="maxPrice" defaultValue={sp.maxPrice} /></label>
        <label>{t("Preismodell")}
          <select name="priceMode" defaultValue={sp.priceMode ?? ""}>
            <option value="">{t("Alle")}</option><option value="FIXED">{t("Festpreis")}</option><option value="NEGOTIABLE">{t("Verhandelbar")}</option>
          </select>
        </label>
        <div className="actions">
          <button type="submit">{t("Filtern")}</button>
          {active && <Link href={`/boerse?view=${sp.newOnly ? "neu" : "markt"}`}><button type="button" className="secondary">{t("Zurücksetzen")}</button></Link>}
        </div>
      </form>
      <section className="card">
        <h2>{rows.length === 1 ? t("1 offener Auftrag") : t("{n} offene Aufträge", { n: rows.length })}{sp.newOnly ? " " + t("aus den letzten 24 Stunden") : ""}</h2>
        {rows.length === 0 ? (
          <Empty>{t("Keine offenen Aufträge für diese Filter.")}</Empty>
        ) : (
          <div className="table-wrap">
            <table className="responsive">
              <thead>
                <tr><th>{t("Abholung")}</th><th>{t("Strecke")}</th><th>{t("Fahrgäste")}</th><th>{t("Fahrzeug")}</th><th>{t("Auftraggeber")}</th><th className="num">{t("Preis")}</th><th>{t("Ihr Stand")}</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const mine = r.quotes[0];
                  return (
                    <tr key={r.id}>
                      <td className="nowrap">{f.dateTime(r.pickupAt)}{r.pickupWindowMinutes ? <span className="price-note">± {r.pickupWindowMinutes} min</span> : null}</td>
                      <td><Route from={r.pickupPlaceId} to={r.dropoffPlaceId} href={`/boerse/auftrag/${r.id}`} /><span className="price-note">{t("ca. {n}", { n: f.minutes(r.estimatedMinutes) })}{r.flightNumber ? ` · ${t("Flug")} ${r.flightNumber}` : ""}</span></td>
                      <td data-label={t("Fahrgäste")}><Load passengers={r.passengers} luggage={r.luggage} ski={r.skiEquipment} /></td>
                      <td data-label={t("Fahrzeug")}>{r.vehicleCategory ? t(VEHICLE_LABEL[r.vehicleCategory]) : <span className="muted">{t("beliebig")}</span>}</td>
                      <td data-label={t("Auftraggeber")}>{r.requesterOrg.name}<span className="price-note">{r.requesterOrg.city} · {t("geprüft")}</span></td>
                      <td className="num"><PriceCell mode={r.priceMode} cents={r.priceCents} /></td>
                      <td>{mine ? <Badge status={mine.status}>{t("Ihr Angebot")} {f.money(mine.amountCents)}</Badge> : <Link href={`/boerse/auftrag/${r.id}`}>{r.priceMode === "FIXED" ? t("Übernehmen") : t("Angebot abgeben")}</Link>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

async function CapacityMarketView({ actor }: { actor: OrgActor }) {
  const { t, f } = await getI18n();
  const rows = await listMarketCapacity(actor);
  return (
    <section className="card">
      <h2>{t("Freie Fahrzeugkapazitäten anderer Unternehmen")}</h2>
      <p className="muted">{t("Geplante Fahrten sind unverbindlich, bis das Unternehmen sie bestätigt hat.")}</p>
      {rows.length === 0 ? <Empty>{t("Derzeit keine freien Kapazitäten.")}</Empty> : (
        <div className="table-wrap">
          <table className="responsive">
            <thead><tr><th>{t("Zeitfenster")}</th><th>{t("Strecke")}</th><th>{t("Fahrzeug")}</th><th>{t("Plätze")}</th><th>{t("Umweg / Wartezeit")}</th><th>{t("Unternehmen")}</th><th>{t("Status")}</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="nowrap">{f.dateTime(c.availableFrom)} – {f.time(c.availableUntil)}</td>
                  <td><Route from={c.fromPlaceId} to={c.toPlaceId} />{c.note && <span className="price-note">{c.note}</span>}</td>
                  <td data-label={t("Fahrzeug")}>{t(VEHICLE_LABEL[c.vehicleCategory])}</td>
                  <td data-label={t("Plätze")}>{t("{p} Pers. · {l} Gep.", { p: c.seats, l: c.luggage })}</td>
                  <td data-label={t("Umweg")}>{t("bis {d} / {w} min", { d: c.maxDetourMinutes, w: c.maxWaitMinutes })}</td>
                  <td data-label={t("Unternehmen")}>{c.organization.name}</td>
                  <td><Badge status={c.status}>{t(CAPACITY_STATUS_LABEL[c.status])}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

async function ReturnTripsView({ actor }: { actor: OrgActor }) {
  const { t, f } = await getI18n();
  const offers = await listCapacityWithMatches(actor);
  if (offers.length === 0) {
    return <section className="card"><h2>{t("Passende Rückfahrten")}</h2><Empty>{t("Sie haben keine geplanten Fahrten veröffentlicht.")}{" "}<Link href="/flotte#fahrt">{t("Rückfahrt anbieten")}</Link></Empty></section>;
  }
  return (
    <>
      {offers.map(({ offer, matches }) => (
        <section className="card" key={offer.id}>
          <div className="head-row">
            <div>
              <h2><Route from={offer.fromPlaceId} to={offer.toPlaceId} /></h2>
              <p className="muted" style={{ margin: 0 }}>
                {f.dateTime(offer.availableFrom)} – {f.time(offer.availableUntil)} · {offer.vehicle?.label ?? t(VEHICLE_LABEL[offer.vehicleCategory])} ·{" "}
                {t("{s} Plätze, {l} Gepäck · Umweg bis {d} min, Wartezeit bis {w} min", { s: offer.seats, l: offer.luggage, d: offer.maxDetourMinutes, w: offer.maxWaitMinutes })}
              </p>
            </div>
            <div className="inline">
              <Badge status={offer.status}>{t(CAPACITY_STATUS_LABEL[offer.status])}</Badge>
              {offer.status === "PLANNED" && (
                <form action={setCapacityStatusAction}>
                  <input type="hidden" name="offerId" value={offer.id} />
                  <input type="hidden" name="status" value="CONFIRMED" />
                  <button type="submit" className="secondary" title={t("Zeitplan geprüft, Fahrer eingeplant")}>{t("Als verbindlich bestätigen")}</button>
                </form>
              )}
              <form action={setCapacityStatusAction}>
                <input type="hidden" name="offerId" value={offer.id} />
                <input type="hidden" name="status" value="WITHDRAWN" />
                <button type="submit" className="link">{t("Zurückziehen")}</button>
              </form>
            </div>
          </div>
          {matches.length === 0 ? <Empty>{t("Noch kein passender Auftrag.")}</Empty> : (
            <div className="table-wrap">
              <table className="responsive">
                <thead><tr><th>{t("Abholung")}</th><th>{t("Strecke")}</th><th>{t("Fahrgäste")}</th><th>{t("Umweg")}</th><th>{t("Wartezeit")}</th><th className="num">{t("Preis")}</th><th></th></tr></thead>
                <tbody>
                  {matches.map(({ request: r, match }) => (
                    <tr key={r.id} className="match">
                      <td className="nowrap">{f.dateTime(r.pickupAt)}</td>
                      <td><Route from={r.pickupPlaceId} to={r.dropoffPlaceId} href={`/boerse/auftrag/${r.id}`} /><span className="price-note">{r.requesterOrg.name}</span></td>
                      <td data-label={t("Fahrgäste")}><Load passengers={r.passengers} luggage={r.luggage} ski={r.skiEquipment} /></td>
                      <td data-label={t("Umweg")}>{t("ca. {n} min", { n: match.detourMinutes })}</td>
                      <td data-label={t("Wartezeit")}>{t("ca. {n} min", { n: match.waitMinutes })}</td>
                      <td className="num"><PriceCell mode={r.priceMode} cents={r.priceCents} /></td>
                      <td><Link href={`/boerse/auftrag/${r.id}`}>{r.priceMode === "FIXED" ? t("Übernehmen") : t("Angebot abgeben")}</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="price-note">{t("Umweg und Wartezeit sind Schätzungen aus Luftlinie und Straßenfaktor, bis ein Routingdienst angebunden ist.")}</p>
        </section>
      ))}
    </>
  );
}

async function OwnRequestsView({ actor }: { actor: OrgActor }) {
  const { t, f } = await getI18n();
  const rows = await listOwnRequests(actor);
  return (
    <section className="card">
      <h2>{t("Eigene veröffentlichte Aufträge")}</h2>
      {rows.length === 0 ? <Empty>{t("Noch keine Aufträge.")}{" "}<Link href="/boerse/neu">{t("Auftrag einstellen")}</Link></Empty> : (
        <div className="table-wrap">
          <table className="responsive">
            <thead><tr><th>{t("Nr.")}</th><th>{t("Abholung")}</th><th>{t("Strecke")}</th><th>{t("Fahrgäste")}</th><th className="num">{t("Preis")}</th><th>{t("Status")}</th><th>{t("Angebote / Ausführung")}</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="nowrap"><Link href={`/boerse/auftrag/${r.id}`}>{referenceOf(r.number)}</Link>{r.clientReference && <span className="price-note">Ref. {r.clientReference}</span>}</td>
                  <td className="nowrap">{f.dateTime(r.pickupAt)}</td>
                  <td><Route from={r.pickupPlaceId} to={r.dropoffPlaceId} href={`/boerse/auftrag/${r.id}`} /></td>
                  <td data-label={t("Fahrgäste")}><Load passengers={r.passengers} luggage={r.luggage} /></td>
                  <td className="num">{r.booking ? <span className="price-fixed">{f.money(r.booking.agreedPriceCents)}<span className="price-note">{t("bestätigt")}</span></span> : <PriceCell mode={r.priceMode} cents={r.priceCents} />}</td>
                  <td><Badge status={r.status}>{t(TRANSFER_STATUS_LABEL[r.status])}</Badge></td>
                  <td>{r.booking ? r.booking.providerOrg.name : r.status === "OPEN" ? (r._count.quotes ? <Link href={`/boerse/auftrag/${r.id}`}>{t(r._count.quotes > 1 ? "{n} Angebote vergleichen" : "{n} Angebot vergleichen", { n: r._count.quotes })}</Link> : <span className="muted">{t("noch keine")}</span>) : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

async function QuotesView({ actor }: { actor: OrgActor }) {
  const { t, f } = await getI18n();
  const incoming = actorCan(actor, "bookings.manage") ? await listIncomingQuotes(actor) : [];
  const own = actorCan(actor, "quotes.submit") ? await listOwnQuotes(actor) : [];
  return (
    <>
      {actorCan(actor, "bookings.manage") && (
        <section className="card">
          <h2>{t("Eingegangene Angebote auf Ihre Aufträge")}</h2>
          {incoming.length === 0 ? <Empty>{t("Keine offenen Angebote.")}</Empty> : (
            <div className="table-wrap">
              <table className="responsive">
                <thead><tr><th>{t("Auftrag")}</th><th>{t("Abholung")}</th><th>{t("Anbieter")}</th><th>{t("Fahrzeug")}</th><th className="num">{t("Angebot")}</th><th className="num">{t("Ihr Richtpreis")}</th></tr></thead>
                <tbody>
                  {incoming.map((q) => (
                    <tr key={q.id}>
                      <td><Route from={q.request.pickupPlaceId} to={q.request.dropoffPlaceId} href={`/boerse/auftrag/${q.request.id}`} /><span className="price-note">{referenceOf(q.request.number)}</span></td>
                      <td className="nowrap">{f.dateTime(q.request.pickupAt)}</td>
                      <td data-label={t("Anbieter")}>{q.providerOrg.name}<span className="price-note">{q.providerOrg.city}</span></td>
                      <td data-label={t("Fahrzeug")}>{t(VEHICLE_LABEL[q.vehicleCategory])}</td>
                      <td className="num price-fixed">{f.money(q.amountCents)}</td>
                      <td className="num muted">{f.money(q.request.priceCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
      {actorCan(actor, "quotes.submit") && (
        <section className="card">
          <h2>{t("Ihre abgegebenen Angebote")}</h2>
          {own.length === 0 ? <Empty>{t("Sie haben keine offenen Angebote.")}</Empty> : (
            <div className="table-wrap">
              <table className="responsive">
                <thead><tr><th>{t("Auftrag")}</th><th>{t("Abholung")}</th><th className="num">{t("Ihr Preis")}</th><th>{t("Status")}</th></tr></thead>
                <tbody>
                  {own.map((q) => (
                    <tr key={q.id}>
                      <td>{q.request.status === "OPEN" ? <Route from={q.request.pickupPlaceId} to={q.request.dropoffPlaceId} href={`/boerse/auftrag/${q.request.id}`} /> : <Route from={q.request.pickupPlaceId} to={q.request.dropoffPlaceId} />}</td>
                      <td className="nowrap">{f.dateTime(q.request.pickupAt)}</td>
                      <td className="num">{f.money(q.amountCents)}</td>
                      <td><Badge status={q.status}>{t(QUOTE_STATUS_LABEL[q.status])}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}

async function BookingsView({ actor, side, statuses, title }: {
  actor: OrgActor; side: "provider" | "both"; statuses: ("CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "DISPUTED")[]; title: string;
}) {
  const { t, f } = await getI18n();
  const rows = await listBookings(actor, side, statuses);
  return (
    <section className="card">
      <h2>{title}</h2>
      {rows.length === 0 ? <Empty>{t("Keine Einträge.")}</Empty> : (
        <div className="table-wrap">
          <table className="responsive">
            <thead><tr><th>{t("Buchung")}</th><th>{t("Abholung")}</th><th>{t("Strecke")}</th><th>{t("Ihre Rolle")}</th><th>{t("Gegenüber")}</th><th className="num">{t("Bestätigter Preis")}</th><th>{t("Status")}</th></tr></thead>
            <tbody>
              {rows.map((b) => {
                const asProvider = b.providerOrgId === actor.org.id;
                return (
                  <tr key={b.id}>
                    <td className="nowrap"><Link href={`/boerse/auftrag/${b.request.id}`}>B-{String(b.request.number).padStart(6, "0")}</Link></td>
                    <td className="nowrap">{f.dateTime(b.request.pickupAt)}</td>
                    <td><Route from={b.request.pickupPlaceId} to={b.request.dropoffPlaceId} href={`/boerse/auftrag/${b.request.id}`} /></td>
                    <td data-label={t("Rolle")}>{asProvider ? t("Ausführend") : t("Auftraggeber")}</td>
                    <td data-label={t("Gegenüber")}>{asProvider ? b.requesterOrg.name : b.providerOrg.name}</td>
                    <td className="num price-fixed">{f.money(b.agreedPriceCents)}</td>
                    <td><Badge status={b.status}>{t(BOOKING_STATUS_LABEL[b.status])}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

