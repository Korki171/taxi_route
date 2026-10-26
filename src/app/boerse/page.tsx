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

function PriceCell({ mode, cents }: { mode: "FIXED" | "NEGOTIABLE"; cents: number | null }) {
  return mode === "FIXED" ? (
    <span className="price-fixed">{formatCents(cents)}<span className="price-note">Festpreis</span></span>
  ) : (
    <span className="price-guide"><strong>{cents ? formatCents(cents) : "offen"}</strong><span className="price-note">Richtpreis, verhandelbar</span></span>
  );
}

export default async function BoersePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const actor = await requireOrgActor();
  const views = VIEWS.filter((v) => v.allowed(actor));
  if (views.length === 0) redirect("/dashboard");
  const view = views.find((v) => v.id === sp.view) ?? views[0];

  return (
    <AppShell actor={actor}>
      <div className="head-row">
        <div>
          <h1>Auftragsbörse</h1>
          <p className="sub">Transferaufträge, Angebote und freie Kapazitäten zwischen geprüften Unternehmen</p>
        </div>
        <div className="inline">
          {actorCan(actor, "transfers.request") && <Link href="/boerse/neu"><button type="button">Auftrag einstellen</button></Link>}
          {actorCan(actor, "capacity.publish") && <Link href="/flotte#fahrt"><button type="button" className="secondary">Rückfahrt anbieten</button></Link>}
        </div>
      </div>
      <Flash searchParams={sp} />
      <nav className="tabs" aria-label="Ansichten der Börse">
        {views.map((v) => (
          <Link key={v.id} href={`/boerse?view=${v.id}`} aria-current={v.id === view.id ? "page" : undefined}>{v.label}</Link>
        ))}
      </nav>
      {view.id === "markt" && <MarketView actor={actor} sp={sp} />}
      {view.id === "neu" && <MarketView actor={actor} sp={{ ...sp, newOnly: "1" }} />}
      {view.id === "kapazitaeten" && <CapacityMarketView actor={actor} />}
      {view.id === "rueckfahrten" && <ReturnTripsView actor={actor} />}
      {view.id === "meine" && <OwnRequestsView actor={actor} />}
      {view.id === "angebote" && <QuotesView actor={actor} />}
      {view.id === "uebernommen" && <BookingsView actor={actor} side="provider" statuses={["CONFIRMED"]} title="Übernommene Aufträge, noch nicht gefahren" />}
      {view.id === "fahrten" && <BookingsView actor={actor} side="both" statuses={["IN_PROGRESS", "COMPLETED"]} title="Laufende und abgeschlossene Fahrten" />}
      {view.id === "probleme" && <BookingsView actor={actor} side="both" statuses={["CANCELLED", "DISPUTED"]} title="Stornierte oder beanstandete Buchungen" />}
    </AppShell>
  );
}

async function MarketView({ actor, sp }: { actor: OrgActor; sp: Record<string, string | undefined> }) {
  const filter = Object.fromEntries(FILTER_KEYS.map((k) => [k, sp[k] ?? ""]));
  const maxPriceCents = sp.maxPrice ? String(Math.round(Number(sp.maxPrice) * 100)) : "";
  const rows = await searchBoard(actor, { ...filter, maxPrice: maxPriceCents, newOnly: sp.newOnly });
  const active = FILTER_KEYS.some((k) => sp[k]);
  return (
    <>
      <form className="card filters" method="get" aria-label="Filter">
        <input type="hidden" name="view" value={sp.newOnly ? "neu" : "markt"} />
        <label>Von<PlaceSelect name="from" defaultValue={sp.from} emptyLabel="Alle Orte" /></label>
        <label>Nach<PlaceSelect name="to" defaultValue={sp.to} emptyLabel="Alle Orte" /></label>
        <label>Region Start
          <select name="fromRegion" defaultValue={sp.fromRegion ?? ""}>
            <option value="">Alle</option>
            {Object.entries(REGION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>Region Ziel
          <select name="toRegion" defaultValue={sp.toRegion ?? ""}>
            <option value="">Alle</option>
            {Object.entries(REGION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>Land
          <select name="country" defaultValue={sp.country ?? ""}>
            <option value="">Alle</option>
            <option value="AT">Österreich</option><option value="DE">Deutschland</option>
            <option value="IT">Italien</option><option value="CH">Schweiz</option>
          </select>
        </label>
        <label>Ab Datum<input type="date" name="dateFrom" defaultValue={sp.dateFrom} /></label>
        <label>Bis Datum<input type="date" name="dateTo" defaultValue={sp.dateTo} /></label>
        <label>Mein Fahrzeug<VehicleSelect name="vehicleCategory" defaultValue={sp.vehicleCategory} emptyLabel="Alle" /></label>
        <label>Max. Personen<input type="number" min={1} name="maxPassengers" defaultValue={sp.maxPassengers} /></label>
        <label>Preis bis (€)<input type="number" min={0} name="maxPrice" defaultValue={sp.maxPrice} /></label>
        <label>Preismodell
          <select name="priceMode" defaultValue={sp.priceMode ?? ""}>
            <option value="">Alle</option><option value="FIXED">Festpreis</option><option value="NEGOTIABLE">Verhandelbar</option>
          </select>
        </label>
        <div className="actions">
          <button type="submit">Filtern</button>
          {active && <Link href={`/boerse?view=${sp.newOnly ? "neu" : "markt"}`}><button type="button" className="secondary">Zurücksetzen</button></Link>}
        </div>
      </form>
      <section className="card">
        <h2>{rows.length} offene{rows.length === 1 ? "r" : ""} Auftr{rows.length === 1 ? "ag" : "äge"}{sp.newOnly ? " aus den letzten 24 Stunden" : ""}</h2>
        {rows.length === 0 ? (
          <Empty>Keine offenen Aufträge für diese Filter.</Empty>
        ) : (
          <div className="table-wrap">
            <table className="responsive">
              <thead>
                <tr><th>Abholung</th><th>Strecke</th><th>Fahrgäste</th><th>Fahrzeug</th><th>Auftraggeber</th><th className="num">Preis</th><th>Ihr Stand</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const mine = r.quotes[0];
                  return (
                    <tr key={r.id}>
                      <td className="nowrap">{fmtDateTime(r.pickupAt)}{r.pickupWindowMinutes ? <span className="price-note">± {r.pickupWindowMinutes} min</span> : null}</td>
                      <td><Route from={r.pickupPlaceId} to={r.dropoffPlaceId} href={`/boerse/auftrag/${r.id}`} /><span className="price-note">ca. {fmtMinutes(r.estimatedMinutes)}{r.flightNumber ? ` · Flug ${r.flightNumber}` : ""}</span></td>
                      <td data-label="Fahrgäste"><Load passengers={r.passengers} luggage={r.luggage} ski={r.skiEquipment} /></td>
                      <td data-label="Fahrzeug">{r.vehicleCategory ? VEHICLE_LABEL[r.vehicleCategory] : <span className="muted">beliebig</span>}</td>
                      <td data-label="Auftraggeber">{r.requesterOrg.name}<span className="price-note">{r.requesterOrg.city} · geprüft</span></td>
                      <td className="num"><PriceCell mode={r.priceMode} cents={r.priceCents} /></td>
                      <td>{mine ? <Badge status={mine.status}>Ihr Angebot {formatCents(mine.amountCents)}</Badge> : <Link href={`/boerse/auftrag/${r.id}`}>{r.priceMode === "FIXED" ? "Übernehmen" : "Angebot abgeben"}</Link>}</td>
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
  const rows = await listMarketCapacity(actor);
  return (
    <section className="card">
      <h2>Freie Fahrzeugkapazitäten anderer Unternehmen</h2>
      <p className="muted">Geplante Fahrten sind unverbindlich, bis das Unternehmen sie bestätigt hat.</p>
      {rows.length === 0 ? <Empty>Derzeit keine freien Kapazitäten.</Empty> : (
        <div className="table-wrap">
          <table className="responsive">
            <thead><tr><th>Zeitfenster</th><th>Strecke</th><th>Fahrzeug</th><th>Plätze</th><th>Umweg / Wartezeit</th><th>Unternehmen</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="nowrap">{fmtDateTime(c.availableFrom)} – {fmtTime(c.availableUntil)}</td>
                  <td><Route from={c.fromPlaceId} to={c.toPlaceId} />{c.note && <span className="price-note">{c.note}</span>}</td>
                  <td data-label="Fahrzeug">{VEHICLE_LABEL[c.vehicleCategory]}</td>
                  <td data-label="Plätze">{c.seats} Pers. · {c.luggage} Gep.</td>
                  <td data-label="Umweg">bis {c.maxDetourMinutes} / {c.maxWaitMinutes} min</td>
                  <td data-label="Unternehmen">{c.organization.name}</td>
                  <td><Badge status={c.status}>{CAPACITY_STATUS_LABEL[c.status]}</Badge></td>
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
  const offers = await listCapacityWithMatches(actor);
  if (offers.length === 0) {
    return <section className="card"><h2>Passende Rückfahrten</h2><Empty>Sie haben keine geplanten Fahrten veröffentlicht. <Link href="/flotte#fahrt">Rückfahrt anbieten</Link></Empty></section>;
  }
  return (
    <>
      {offers.map(({ offer, matches }) => (
        <section className="card" key={offer.id}>
          <div className="head-row">
            <div>
              <h2><Route from={offer.fromPlaceId} to={offer.toPlaceId} /></h2>
              <p className="muted" style={{ margin: 0 }}>
                {fmtDateTime(offer.availableFrom)} – {fmtTime(offer.availableUntil)} · {offer.vehicle?.label ?? VEHICLE_LABEL[offer.vehicleCategory]} ·{" "}
                {offer.seats} Plätze, {offer.luggage} Gepäck · Umweg bis {offer.maxDetourMinutes} min, Wartezeit bis {offer.maxWaitMinutes} min
              </p>
            </div>
            <div className="inline">
              <Badge status={offer.status}>{CAPACITY_STATUS_LABEL[offer.status]}</Badge>
              {offer.status === "PLANNED" && (
                <form action={setCapacityStatusAction}>
                  <input type="hidden" name="offerId" value={offer.id} />
                  <input type="hidden" name="status" value="CONFIRMED" />
                  <button type="submit" className="secondary" title="Zeitplan geprüft, Fahrer eingeplant">Als verbindlich bestätigen</button>
                </form>
              )}
              <form action={setCapacityStatusAction}>
                <input type="hidden" name="offerId" value={offer.id} />
                <input type="hidden" name="status" value="WITHDRAWN" />
                <button type="submit" className="link">Zurückziehen</button>
              </form>
            </div>
          </div>
          {matches.length === 0 ? <Empty>Noch kein passender Auftrag.</Empty> : (
            <div className="table-wrap">
              <table className="responsive">
                <thead><tr><th>Abholung</th><th>Strecke</th><th>Fahrgäste</th><th>Umweg</th><th>Wartezeit</th><th className="num">Preis</th><th></th></tr></thead>
                <tbody>
                  {matches.map(({ request: r, match }) => (
                    <tr key={r.id} className="match">
                      <td className="nowrap">{fmtDateTime(r.pickupAt)}</td>
                      <td><Route from={r.pickupPlaceId} to={r.dropoffPlaceId} href={`/boerse/auftrag/${r.id}`} /><span className="price-note">{r.requesterOrg.name}</span></td>
                      <td data-label="Fahrgäste"><Load passengers={r.passengers} luggage={r.luggage} ski={r.skiEquipment} /></td>
                      <td data-label="Umweg">ca. {match.detourMinutes} min</td>
                      <td data-label="Wartezeit">ca. {match.waitMinutes} min</td>
                      <td className="num"><PriceCell mode={r.priceMode} cents={r.priceCents} /></td>
                      <td><Link href={`/boerse/auftrag/${r.id}`}>{r.priceMode === "FIXED" ? "Übernehmen" : "Angebot abgeben"}</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="price-note">Umweg und Wartezeit sind Schätzungen aus Luftlinie und Straßenfaktor, bis ein Routingdienst angebunden ist.</p>
        </section>
      ))}
    </>
  );
}

async function OwnRequestsView({ actor }: { actor: OrgActor }) {
  const rows = await listOwnRequests(actor);
  return (
    <section className="card">
      <h2>Eigene veröffentlichte Aufträge</h2>
      {rows.length === 0 ? <Empty>Noch keine Aufträge. <Link href="/boerse/neu">Auftrag einstellen</Link></Empty> : (
        <div className="table-wrap">
          <table className="responsive">
            <thead><tr><th>Nr.</th><th>Abholung</th><th>Strecke</th><th>Fahrgäste</th><th className="num">Preis</th><th>Status</th><th>Angebote / Ausführung</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="nowrap"><Link href={`/boerse/auftrag/${r.id}`}>{referenceOf(r.number)}</Link>{r.clientReference && <span className="price-note">Ref. {r.clientReference}</span>}</td>
                  <td className="nowrap">{fmtDateTime(r.pickupAt)}</td>
                  <td><Route from={r.pickupPlaceId} to={r.dropoffPlaceId} href={`/boerse/auftrag/${r.id}`} /></td>
                  <td data-label="Fahrgäste"><Load passengers={r.passengers} luggage={r.luggage} /></td>
                  <td className="num">{r.booking ? <span className="price-fixed">{formatCents(r.booking.agreedPriceCents)}<span className="price-note">bestätigt</span></span> : <PriceCell mode={r.priceMode} cents={r.priceCents} />}</td>
                  <td><Badge status={r.status}>{TRANSFER_STATUS_LABEL[r.status]}</Badge></td>
                  <td>{r.booking ? r.booking.providerOrg.name : r.status === "OPEN" ? (r._count.quotes ? <Link href={`/boerse/auftrag/${r.id}`}>{r._count.quotes} Angebot{r._count.quotes > 1 ? "e" : ""} vergleichen</Link> : <span className="muted">noch keine</span>) : "–"}</td>
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
  const incoming = actorCan(actor, "bookings.manage") ? await listIncomingQuotes(actor) : [];
  const own = actorCan(actor, "quotes.submit") ? await listOwnQuotes(actor) : [];
  return (
    <>
      {actorCan(actor, "bookings.manage") && (
        <section className="card">
          <h2>Eingegangene Angebote auf Ihre Aufträge</h2>
          {incoming.length === 0 ? <Empty>Keine offenen Angebote.</Empty> : (
            <div className="table-wrap">
              <table className="responsive">
                <thead><tr><th>Auftrag</th><th>Abholung</th><th>Anbieter</th><th>Fahrzeug</th><th className="num">Angebot</th><th className="num">Ihr Richtpreis</th></tr></thead>
                <tbody>
                  {incoming.map((q) => (
                    <tr key={q.id}>
                      <td><Route from={q.request.pickupPlaceId} to={q.request.dropoffPlaceId} href={`/boerse/auftrag/${q.request.id}`} /><span className="price-note">{referenceOf(q.request.number)}</span></td>
                      <td className="nowrap">{fmtDateTime(q.request.pickupAt)}</td>
                      <td data-label="Anbieter">{q.providerOrg.name}<span className="price-note">{q.providerOrg.city}</span></td>
                      <td data-label="Fahrzeug">{VEHICLE_LABEL[q.vehicleCategory]}</td>
                      <td className="num price-fixed">{formatCents(q.amountCents)}</td>
                      <td className="num muted">{formatCents(q.request.priceCents)}</td>
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
          <h2>Ihre abgegebenen Angebote</h2>
          {own.length === 0 ? <Empty>Sie haben keine offenen Angebote.</Empty> : (
            <div className="table-wrap">
              <table className="responsive">
                <thead><tr><th>Auftrag</th><th>Abholung</th><th className="num">Ihr Preis</th><th>Status</th></tr></thead>
                <tbody>
                  {own.map((q) => (
                    <tr key={q.id}>
                      <td>{q.request.status === "OPEN" ? <Route from={q.request.pickupPlaceId} to={q.request.dropoffPlaceId} href={`/boerse/auftrag/${q.request.id}`} /> : <Route from={q.request.pickupPlaceId} to={q.request.dropoffPlaceId} />}</td>
                      <td className="nowrap">{fmtDateTime(q.request.pickupAt)}</td>
                      <td className="num">{formatCents(q.amountCents)}</td>
                      <td><Badge status={q.status}>{QUOTE_STATUS_LABEL[q.status]}</Badge></td>
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
  const rows = await listBookings(actor, side, statuses);
  return (
    <section className="card">
      <h2>{title}</h2>
      {rows.length === 0 ? <Empty>Keine Einträge.</Empty> : (
        <div className="table-wrap">
          <table className="responsive">
            <thead><tr><th>Buchung</th><th>Abholung</th><th>Strecke</th><th>Ihre Rolle</th><th>Gegenüber</th><th className="num">Bestätigter Preis</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((b) => {
                const asProvider = b.providerOrgId === actor.org.id;
                return (
                  <tr key={b.id}>
                    <td className="nowrap"><Link href={`/boerse/auftrag/${b.request.id}`}>B-{String(b.request.number).padStart(6, "0")}</Link></td>
                    <td className="nowrap">{fmtDateTime(b.request.pickupAt)}</td>
                    <td><Route from={b.request.pickupPlaceId} to={b.request.dropoffPlaceId} href={`/boerse/auftrag/${b.request.id}`} /></td>
                    <td data-label="Rolle">{asProvider ? "Ausführend" : "Auftraggeber"}</td>
                    <td data-label="Gegenüber">{asProvider ? b.requesterOrg.name : b.providerOrg.name}</td>
                    <td className="num price-fixed">{formatCents(b.agreedPriceCents)}</td>
                    <td><Badge status={b.status}>{BOOKING_STATUS_LABEL[b.status]}</Badge></td>
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

