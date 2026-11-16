import Link from "next/link";
import { escalateDueRequests } from "@/server/services/partners";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PushSetup } from "@/components/PushSetup";
import { Empty, Load, PlaceSelect, Route, VehicleSelect } from "@/components/market";
import { Badge, Flash, Stars, type SP } from "@/components/ui";
import { BoardMap, type BoardMapPoint } from "@/components/BoardMap";
import { ratingSummaries } from "@/server/services/ratings";
import { fmtDateTime, fmtMinutes, fmtTime } from "@/lib/format";
import {
  BOOKING_STATUS_LABEL,
  CAPACITY_STATUS_LABEL,
  QUOTE_STATUS_LABEL,
  TENDER_STATUS_LABEL,
  TRANSFER_STATUS_LABEL,
  VEHICLE_LABEL,
} from "@/lib/labels";
import { formatCents } from "@/lib/money";
import { REGION_LABEL, getPlace, placeName } from "@/lib/places";
import { actorCan, type OrgActor } from "@/server/authz/context";
import { listMarketCapacity } from "@/server/services/fleet";
import {
  listBookings,
  listIncomingQuotes,
  listInvitations,
  listOwnQuotes,
  listOwnRequests,
  referenceOf,
  searchBoard,
} from "@/server/services/marketplace";
import { splitHandoff } from "@/lib/handoff";
import { listOpenTenders, listOwnTenders } from "@/server/services/tenders";
import { listCapacityWithMatches } from "@/server/services/matching";
import { requireOrgActor } from "@/server/web";
import { addJobAlertAction, setCapacityStatusAction } from "../actions";
import { getI18n } from "@/server/i18n";

type View = { id: string; label: string; allowed: (a: OrgActor) => boolean };

const VIEWS: View[] = [
  { id: "markt", label: "Passende Aufträge", allowed: (a) => actorCan(a, "jobs.accept") },
  { id: "anfragen", label: "Direktanfragen", allowed: (a) => actorCan(a, "jobs.accept") },
  { id: "neu", label: "Neue Aufträge", allowed: (a) => actorCan(a, "jobs.accept") },
  { id: "ausschreibungen", label: "Ausschreibungen", allowed: (a) => actorCan(a, "jobs.accept") },
  { id: "kapazitaeten", label: "Freie Kapazitäten", allowed: (a) => actorCan(a, "jobs.accept") },
  { id: "rueckfahrten", label: "Passende Rückfahrten", allowed: (a) => actorCan(a, "capacity.publish") },
  { id: "meine", label: "Eigene Aufträge", allowed: (a) => actorCan(a, "transfers.request") },
  { id: "meine-ausschreibungen", label: "Ausschreibungen", allowed: (a) => actorCan(a, "transfers.request") },
  { id: "angebote", label: "Angebote", allowed: (a) => actorCan(a, "bookings.manage") || actorCan(a, "quotes.submit") },
  { id: "uebernommen", label: "Übernommene Aufträge", allowed: (a) => actorCan(a, "jobs.accept") },
  { id: "fahrten", label: "Laufend und abgeschlossen", allowed: () => true },
  { id: "probleme", label: "Storniert oder beanstandet", allowed: () => true },
];

/** Obere Reiter: wenige Gruppen. Innerhalb einer Gruppe wählt man mit kleinen Knöpfen („Chips“) die Ansicht. */
const GROUPS: { id: string; label: string; views: string[] }[] = [
  { id: "finden", label: "Aufträge finden", views: ["markt", "neu", "anfragen", "ausschreibungen"] },
  { id: "meine", label: "Meine Aufträge", views: ["meine", "angebote", "uebernommen", "fahrten", "probleme", "meine-ausschreibungen"] },
  { id: "fahrzeuge", label: "Freie Fahrzeuge", views: ["kapazitaeten", "rueckfahrten"] },
];
/** Chips: „Neue Aufträge“ ist ein Filter (Schalter im Filter), kein eigener Knopf. */
const CHIP_HIDDEN = new Set(["neu"]);

const FILTER_KEYS = ["from", "to", "radiusKm", "nearMe", "fromRegion", "toRegion", "country", "dateFrom", "dateTo", "vehicleCategory", "minPassengers", "maxPassengers", "maxPrice", "priceMode", "newOnly"];

async function PriceCell({ mode, cents, share = 0 }: { mode: "FIXED" | "NEGOTIABLE"; cents: number | null; share?: number }) {
  const { t, f } = await getI18n();
  const shareNote = share > 0 ? <span className="price-note price-share">{t("davon {p} % Abgabe-Anteil", { p: share })}</span> : null;
  return mode === "FIXED" ? (
    <span className="price-fixed">{f.money(cents)}<span className="price-note">{t("Festpreis")}</span>{shareNote}</span>
  ) : (
    <span className="price-guide"><strong>{cents ? f.money(cents) : t("offen")}</strong><span className="price-note">{t("Richtpreis, verhandelbar")}</span>{shareNote}</span>
  );
}

export default async function BoersePage({ searchParams }: { searchParams: SP }) {
  const { t, f } = await getI18n();
  const sp = await searchParams;
  const actor = await requireOrgActor();
  await escalateDueRequests().catch(() => 0);
  const views = VIEWS.filter((v) => v.allowed(actor));
  if (views.length === 0) redirect("/dashboard");
  const view = views.find((v) => v.id === sp.view) ?? views[0];
  const groups = GROUPS.map((g) => ({ ...g, views: views.filter((v) => g.views.includes(v.id)).map((v) => v.id) })).filter((g) => g.views.length > 0);
  const group = groups.find((g) => g.views.includes(view.id)) ?? groups[0];
  const chips = views.filter((v) => group.views.includes(v.id) && !CHIP_HIDDEN.has(v.id));

  return (
    <AppShell actor={actor}>
      <div className="head-row">
        <div>
          <h1>{t("Auftragsbörse")}</h1>
          <p className="sub">{t("Transferaufträge, Angebote und freie Kapazitäten zwischen geprüften Unternehmen")}</p>
        </div>
        <div className="inline">
          {actorCan(actor, "transfers.request") && <Link href="/boerse/neu" className="btn accent">{t("Auftrag einstellen")}</Link>}
          {actorCan(actor, "capacity.publish") && <Link href="/flotte#fahrt" className="btn secondary">{t("Rückfahrt anbieten")}</Link>}
          {actorCan(actor, "transfers.request") && <Link href="/boerse/firmen">{t("Firmenverzeichnis")}</Link>}
        </div>
      </div>
      <Flash searchParams={sp} />
      {actorCan(actor, "jobs.accept") && <PushSetup banner />}
      {groups.length > 1 && (
        <nav className="tabs" aria-label={t("Ansichten der Börse")}>
          {groups.map((g) => (
            <Link key={g.id} href={`/boerse?view=${g.views[0]}`} aria-current={g.id === group.id ? "page" : undefined}>{t(g.label)}</Link>
          ))}
        </nav>
      )}
      {chips.length > 1 && (
        <nav className="chips" aria-label={t("Ansicht wählen")}>
          {chips.map((v) => (
            <Link key={v.id} href={`/boerse?view=${v.id}`} aria-current={v.id === view.id || (view.id === "neu" && v.id === "markt") ? "page" : undefined}>{t(v.label)}</Link>
          ))}
        </nav>
      )}
      {view.id === "markt" && <MarketView actor={actor} sp={sp} />}
      {view.id === "neu" && <MarketView actor={actor} sp={{ ...sp, newOnly: "1" }} />}
      {view.id === "anfragen" && <InvitationsView actor={actor} />}
      {view.id === "ausschreibungen" && <OpenTendersView actor={actor} />}
      {view.id === "meine-ausschreibungen" && <OwnTendersView actor={actor} />}
      {view.id === "kapazitaeten" && <CapacityMarketView actor={actor} />}
      {view.id === "rueckfahrten" && <ReturnTripsView actor={actor} />}
      {view.id === "meine" && <OwnRequestsView actor={actor} />}
      {view.id === "angebote" && <QuotesView actor={actor} />}
      {view.id === "uebernommen" && <BookingsView actor={actor} side="provider" statuses={["CONFIRMED"]} title={t("Übernommene Aufträge, noch nicht gefahren")} />}
      {view.id === "fahrten" && <BookingsView actor={actor} side="both" statuses={["IN_PROGRESS", "COMPLETED"]} title={t("Laufende und abgeschlossene Fahrten")} />}
      {view.id === "probleme" && <BookingsView actor={actor} side="both" statuses={["CANCELLED", "DISPUTED", "NO_SHOW"]} title={t("Stornierte oder beanstandete Buchungen")} />}
    </AppShell>
  );
}

async function MarketView({ actor, sp }: { actor: OrgActor; sp: Record<string, string | undefined> }) {
  const { t, f } = await getI18n();
  const filter = Object.fromEntries(FILTER_KEYS.map((k) => [k, sp[k] ?? ""]));
  const maxPriceCents = sp.maxPrice ? String(Math.round(Number(sp.maxPrice) * 100)) : "";
  const rows = await searchBoard(actor, { ...filter, maxPrice: maxPriceCents, newOnly: sp.newOnly, nearMe: sp.nearMe });
  const active = FILTER_KEYS.some((k) => sp[k]);
  const stars = await ratingSummaries(rows.map((r) => r.requesterOrg.id));
  // Karte: ein Punkt je Abholort, nur auf Wunsch geladen (?map=1)
  const showMap = sp.map === "1";
  const mapQuery = new URLSearchParams({ view: "markt", ...Object.fromEntries(FILTER_KEYS.filter((k) => sp[k]).map((k) => [k, sp[k]!])), ...(showMap ? {} : { map: "1" }) }).toString();
  const mapPoints: BoardMapPoint[] = [];
  if (showMap) {
    for (const r of rows) {
      const place = getPlace(r.pickupPlaceId);
      if (!place) continue;
      let point = mapPoints.find((x) => x.id === place.id);
      if (!point) mapPoints.push((point = { id: place.id, name: t(place.name), lat: place.lat, lng: place.lng, jobs: [] }));
      point.jobs.push({
        href: `/boerse/auftrag/${r.id}`,
        label: `${t(placeName(r.pickupPlaceId))} → ${t(placeName(r.dropoffPlaceId))}`,
        note: `${f.dateTime(r.pickupAt)} · ${r.priceCents ? f.money(r.priceCents) : t("Preis offen")}`,
      });
    }
  }
  return (
    <>
      {(rows.length > 0 || active) && <form className="card filters" method="get" aria-label={t("Filter")}>
        <input type="hidden" name="view" value="markt" />
        <label>{t("Von")}<PlaceSelect name="from" defaultValue={sp.from} emptyLabel={t("Alle Orte")} /></label>
        <label>{t("Nach")}<PlaceSelect name="to" defaultValue={sp.to} emptyLabel={t("Alle Orte")} /></label>
        <label>{t("Ab Datum")}<input type="date" name="dateFrom" defaultValue={sp.dateFrom} /></label>
        <input type="checkbox" id="more-filters" className="more-check" defaultChecked={FILTER_KEYS.some((k) => !["from", "to", "dateFrom"].includes(k) && sp[k])} />
        <label htmlFor="more-filters" className="more-toggle">{t("Mehr Filter")}</label>
        <div className="more">
        <label>{t("Umkreis um „Von“")}
          <select name="radiusKm" defaultValue={sp.radiusKm ?? ""}>
            <option value="">{t("Nur dieser Ort")}</option>
            {[25, 50, 100].map((km) => <option key={km} value={km}>{t("{n} km", { n: km })}</option>)}
          </select>
        </label>
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
        <label>{t("Bis Datum")}<input type="date" name="dateTo" defaultValue={sp.dateTo} /></label>
        <label>{t("Mein Fahrzeug")}<VehicleSelect name="vehicleCategory" defaultValue={sp.vehicleCategory} emptyLabel={t("Alle")} /></label>
        <label>{t("Max. Personen")}<input type="number" min={1} name="maxPassengers" defaultValue={sp.maxPassengers} /></label>
        <label>{t("Preis bis (€)")}<input type="number" min={0} name="maxPrice" defaultValue={sp.maxPrice} /></label>
        <label>{t("Preismodell")}
          <select name="priceMode" defaultValue={sp.priceMode ?? ""}>
            <option value="">{t("Alle")}</option><option value="FIXED">{t("Festpreis")}</option><option value="NEGOTIABLE">{t("Verhandelbar")}</option>
          </select>
        </label>
        <div className="checks"><label><input type="checkbox" name="nearMe" value="1" defaultChecked={!!sp.nearMe} />{" "}{t("Nur in der Nähe meiner Standorte (50 km)")}</label></div>
        <div className="checks"><label><input type="checkbox" name="newOnly" value="1" defaultChecked={!!sp.newOnly} />{" "}{t("Nur neue Aufträge (letzte 24 Stunden)")}</label></div>
        </div>
        <div className="actions">
          <button type="submit">{t("Filtern")}</button>
          {active && <Link href="/boerse?view=markt" className="btn secondary">{t("Zurücksetzen")}</Link>}
        </div>
      </form>}
      {(sp.from || sp.to) && actorCan(actor, "org.update") && (
        <form action={addJobAlertAction} className="save-search">
          <input type="hidden" name="from" value={sp.from ?? ""} />
          <input type="hidden" name="to" value={sp.to ?? ""} />
          <input type="hidden" name="back" value={`/boerse?${new URLSearchParams({ view: "markt", ...Object.fromEntries(FILTER_KEYS.filter((k) => sp[k]).map((k) => [k, sp[k]!])) }).toString()}`} />
          <button type="submit" className="link">{t("Bei neuen Aufträgen für diese Strecke benachrichtigen")}</button>
        </form>
      )}
      <section className="card">
        {rows.length > 0 && (
          <div className="head-row">
            <h2>{rows.length === 1 ? t("1 offener Auftrag") : t("{n} offene Aufträge", { n: rows.length })}{sp.newOnly ? " " + t("aus den letzten 24 Stunden") : ""}</h2>
            <Link href={`/boerse?${mapQuery}`} className="btn secondary">{t(showMap ? "Karte ausblenden" : "Auf der Karte zeigen")}</Link>
          </div>
        )}
        {showMap && rows.length > 0 && <BoardMap points={mapPoints} label={t("Karte der offenen Aufträge")} />}
        {rows.length === 0 ? (
          active ? (
            <Empty>{t("Keine offenen Aufträge für diese Filter.")}</Empty>
          ) : (
            <div className="empty-state">
              <h2>{t("Noch keine Aufträge in der Börse")}</h2>
              <p className="muted">{t("Sobald ein Unternehmen eine Fahrt einstellt, erscheint sie hier. Stellen Sie selbst eine Fahrt ein oder bieten Sie ein freies Fahrzeug an.")}</p>
              <div className="inline">
                {actorCan(actor, "transfers.request") && <Link href="/boerse/neu" className="btn accent">{t("Auftrag einstellen")}</Link>}
                {actorCan(actor, "capacity.publish") && <Link href="/flotte#fahrt" className="btn secondary">{t("Rückfahrt anbieten")}</Link>}
              </div>
            </div>
          )
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
                      <td data-label={t("Auftraggeber")} className="org-cell">{r.requesterOrg.name}<span className="price-note">{r.requesterOrg.city} · {t(r.requesterOrg.type === "TRANSPORT_COMPANY" ? "Konzession geprüft" : "geprüft")}</span><Stars rating={stars.get(r.requesterOrg.id)} /></td>
                      <td className="num"><PriceCell mode={r.priceMode} cents={r.priceCents} share={r.handoffSharePercent} /></td>
                      <td className="nowrap">{r.invitations[0]?.status === "PENDING" && <span className="badge warn">{t("Direktanfrage")}</span>}{mine ? <Badge status={mine.status}>{t("Ihr Angebot")} {f.money(mine.amountCents)}</Badge> : <Link href={`/boerse/auftrag/${r.id}`}>{r.priceMode === "FIXED" ? t("Übernehmen") : t("Angebot abgeben")}</Link>}</td>
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

async function InvitationsView({ actor }: { actor: OrgActor }) {
  const { t, f } = await getI18n();
  const rows = await listInvitations(actor);
  return (
    <section className="card">
      <h2>{t("Direktanfragen an Ihr Unternehmen")}</h2>
      <p className="muted">{t("Auftraggeber haben Sie gezielt um ein Angebot gebeten. Bitte geben Sie ein Angebot ab oder lehnen Sie ab.")}</p>
      {rows.length === 0 ? <Empty>{t("Keine offenen Direktanfragen.")}</Empty> : (
        <div className="table-wrap">
          <table className="responsive">
            <thead><tr><th>{t("Abholung")}</th><th>{t("Strecke")}</th><th>{t("Fahrgäste")}</th><th>{t("Auftraggeber")}</th><th className="num">{t("Preis")}</th><th>{t("Ihr Stand")}</th></tr></thead>
            <tbody>
              {rows.map(({ request: r, createdAt }) => {
                const mine = r.quotes[0];
                return (
                  <tr key={r.id}>
                    <td className="nowrap">{f.dateTime(r.pickupAt)}{r.quoteDeadline && <span className="price-note">{t("Angebote bis")} {f.dateTime(r.quoteDeadline)}</span>}</td>
                    <td><Route from={r.pickupPlaceId} to={r.dropoffPlaceId} href={`/boerse/auftrag/${r.id}`} /><span className="price-note">{t("angefragt {date}", { date: f.dateTime(createdAt) })}{r.visibility === "INVITED" ? ` · ${t("nur für ausgewählte Unternehmen")}` : ""}</span></td>
                    <td data-label={t("Fahrgäste")}><Load passengers={r.passengers} luggage={r.luggage} ski={r.skiEquipment} /></td>
                    <td data-label={t("Auftraggeber")} className="org-cell">{r.requesterOrg.name}<span className="price-note">{r.requesterOrg.city}</span></td>
                    <td className="num"><PriceCell mode={r.priceMode} cents={r.priceCents} share={r.handoffSharePercent} /></td>
                    <td className="nowrap">{mine ? <Badge status={mine.status}>{t("Ihr Angebot")} {f.money(mine.amountCents)}</Badge> : <Link href={`/boerse/auftrag/${r.id}`}>{r.priceMode === "FIXED" ? t("Übernehmen oder ablehnen") : t("Angebot abgeben oder ablehnen")}</Link>}</td>
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
              <p className="muted flush">
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
                      <td className="num"><PriceCell mode={r.priceMode} cents={r.priceCents} share={r.handoffSharePercent} /></td>
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
                  <td className="num">{r.booking ? <span className="price-fixed">{f.money(r.booking.agreedPriceCents)}<span className="price-note">{t("bestätigt")}</span>{r.booking.handoffShareCents > 0 && <span className="price-note price-share">{t("Ihr Anteil {amount}", { amount: f.money(r.booking.handoffShareCents) })}</span>}</span> : <PriceCell mode={r.priceMode} cents={r.priceCents} share={r.handoffSharePercent} />}</td>
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

async function OpenTendersView({ actor }: { actor: OrgActor }) {
  const { t, f } = await getI18n();
  const rows = await listOpenTenders(actor);
  return (
    <section className="card">
      <h2>{t("Offene Ausschreibungen")}</h2>
      {rows.length === 0 ? <Empty>{t("Derzeit keine offenen Ausschreibungen. Hier erscheinen Saison- und Gruppentransfers, für die Sie einen Preis je Fahrt bieten können.")}</Empty> : (
        <div className="table-wrap">
          <table className="responsive">
            <thead><tr><th>{t("Strecke")}</th><th>{t("Zeitraum")}</th><th>{t("Fahrten")}</th><th>{t("Auftraggeber")}</th><th>{t("Angebote bis")}</th><th>{t("Ihr Stand")}</th></tr></thead>
            <tbody>
              {rows.map((x) => (
                <tr key={x.id}>
                  <td><Route from={x.pickupPlaceId} to={x.dropoffPlaceId} href={`/boerse/ausschreibung/${x.id}`} /></td>
                  <td data-label={t("Zeitraum")} className="nowrap">{f.date(x.dateFrom)} {t("bis")} {f.date(x.dateTo)}</td>
                  <td data-label={t("Fahrten")}>{t("etwa {n}", { n: x.estimatedTrips })}</td>
                  <td data-label={t("Auftraggeber")}>{x.requesterOrg.name}<span className="price-note">{x.requesterOrg.city}</span></td>
                  <td data-label={t("Angebote bis")} className="nowrap">{f.date(x.bidDeadline)}</td>
                  <td className="nowrap">{x.bids[0] && x.bids[0].status === "SUBMITTED" ? <Badge status="SUBMITTED">{t("Ihr Angebot")} {f.money(x.bids[0].pricePerTripCents)}</Badge> : <Link href={`/boerse/ausschreibung/${x.id}`}>{t("Angebot abgeben")}</Link>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

async function OwnTendersView({ actor }: { actor: OrgActor }) {
  const { t, f } = await getI18n();
  const rows = await listOwnTenders(actor);
  return (
    <section className="card">
      <div className="head-row">
        <h2>{t("Eigene Ausschreibungen")}</h2>
        <Link href="/boerse/ausschreibung/neu" className="btn secondary">{t("Ausschreibung erstellen")}</Link>
      </div>
      {rows.length === 0 ? <Empty>{t("Noch keine Ausschreibungen. Schreiben Sie viele Fahrten auf einer Strecke auf einmal aus, zum Beispiel alle Transfers einer Saison.")}</Empty> : (
        <div className="table-wrap">
          <table className="responsive">
            <thead><tr><th>{t("Strecke")}</th><th>{t("Zeitraum")}</th><th>{t("Fahrten")}</th><th>{t("Status")}</th><th>{t("Angebote / Ausführung")}</th></tr></thead>
            <tbody>
              {rows.map((x) => (
                <tr key={x.id}>
                  <td><Route from={x.pickupPlaceId} to={x.dropoffPlaceId} href={`/boerse/ausschreibung/${x.id}`} /></td>
                  <td data-label={t("Zeitraum")} className="nowrap">{f.date(x.dateFrom)} {t("bis")} {f.date(x.dateTo)}</td>
                  <td data-label={t("Fahrten")}>{t("etwa {n}", { n: x.estimatedTrips })}</td>
                  <td><Badge status={x.status}>{t(TENDER_STATUS_LABEL[x.status])}</Badge></td>
                  <td>{x.awardedBid ? `${x.awardedBid.providerOrg.name}, ${f.money(x.awardedBid.pricePerTripCents)}` : x._count.bids ? <Link href={`/boerse/ausschreibung/${x.id}`}>{t(x._count.bids > 1 ? "{n} Angebote vergleichen" : "{n} Angebot vergleichen", { n: x._count.bids })}</Link> : <span className="muted">{t("noch keine")}</span>}</td>
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
                      <td className="num price-fixed">{f.money(q.amountCents)}{q.request.handoffSharePercent > 0 && <span className="price-note price-share">{t("Ihr Anteil {amount}", { amount: f.money(splitHandoff(q.amountCents, q.request.handoffSharePercent).shareCents) })}</span>}</td>
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
                      <td className="num">{f.money(q.amountCents)}{q.request.handoffSharePercent > 0 && <span className="price-note price-share">{t("Sie erhalten {amount}", { amount: f.money(splitHandoff(q.amountCents, q.request.handoffSharePercent).providerCents) })}</span>}</td>
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
  actor: OrgActor; side: "provider" | "both"; statuses: ("CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "DISPUTED" | "NO_SHOW")[]; title: string;
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
                    <td className="num price-fixed">{f.money(b.agreedPriceCents)}{b.handoffShareCents > 0 && <span className="price-note price-share">{asProvider ? t("Sie erhalten {amount}", { amount: f.money(b.agreedPriceCents - b.handoffShareCents) }) : t("Ihr Anteil {amount}", { amount: f.money(b.handoffShareCents) })}</span>}</td>
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

