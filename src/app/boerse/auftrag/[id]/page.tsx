import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import type { VehicleCategory } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { Load, Route, VehicleSelect } from "@/components/market";
import { Badge, Flash, type SP } from "@/components/ui";
import { fmtDateTime, fmtMinutes, fmtTime } from "@/lib/format";
import {
  BOOKING_STATUS_LABEL,
  TRIP_STAGE_LABEL,
  QUOTE_STATUS_LABEL,
  TRANSFER_STATUS_LABEL,
  VEHICLE_LABEL,
  priceStateLabel,
} from "@/lib/labels";
import { formatCents } from "@/lib/money";
import { placeName } from "@/lib/places";
import { actorCan } from "@/server/authz/context";
import { AppError } from "@/server/errors";
import { listVehicles } from "@/server/services/fleet";
import { getTransferRequest, referenceOf } from "@/server/services/marketplace";
import { EVENT_LABEL } from "@/server/services/transfer-events";
import { requireOrgActor } from "@/server/web";
import { getI18n } from "@/server/i18n";
import {
  acceptQuoteAction,
  bookingTransitionAction,
  cancelTransferRequestAction,
  rejectQuoteAction,
  submitQuoteAction,
  takeFixedPriceAction,
  withdrawQuoteAction,
} from "../../../actions";

const STAGES = ["Anfrage", "Angebote", "Bestätigt", "Unterwegs", "Durchgeführt"];

function stageIndex(status: string, hasQuotes: boolean) {
  switch (status) {
    case "OPEN": return hasQuotes ? 1 : 0;
    case "ASSIGNED": return 2;
    case "IN_PROGRESS": return 3;
    case "COMPLETED": return 4;
    default: return -1;
  }
}

export default async function RequestDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const { t, f } = await getI18n();
  const { id } = await params;
  const sp = await searchParams;
  const actor = await requireOrgActor();
  const data = await getTransferRequest(actor, id).catch((e) => {
    if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
    throw e;
  });
  const { role, request: r, contacts, quotes, events } = data;
  const booking = r.booking;
  const myQuote = role === "market" ? quotes[0] : undefined;
  const openQuotes = quotes.filter((q) => q.status === "SUBMITTED");
  const vehicles = role === "market" && actorCan(actor, "fleet.manage") ? (await listVehicles(actor)).filter((v) => v.active) : [];
  const stage = stageIndex(r.status, role === "requester" ? openQuotes.length > 0 : !!myQuote);
  const orgName = (orgId: string | null) =>
    orgId === actor.org.id ? t("Ihr Unternehmen")
      : orgId === r.requesterOrg.id ? r.requesterOrg.name
      : orgId && orgId === booking?.providerOrgId ? booking.providerOrg.name
      : quotes.find((q) => q.providerOrgId === orgId)?.providerOrg.name ?? t("Anbieter");
  const scope = booking?.scope as { vehicleCategory?: VehicleCategory | null } | undefined;

  return (
    <AppShell actor={actor}>
      <p className="back">
        <Link href={role === "market" ? "/boerse" : role === "requester" ? "/boerse?view=meine" : "/boerse?view=uebernommen"}>{t("← Zur Börse")}</Link>
      </p>
      <div className="head-row">
        <div>
          <h1><Route from={r.pickupPlaceId} to={r.dropoffPlaceId} /></h1>
          <p className="sub">
            {referenceOf(r.number)} · {t("Abholung")} {f.dateTime(r.pickupAt)}{r.pickupWindowMinutes ? ` ± ${r.pickupWindowMinutes} min` : ""} · {t("Fahrzeit ca. {n}", { n: f.minutes(r.estimatedMinutes) })}
          </p>
        </div>
        <Badge status={r.status}>{t(TRANSFER_STATUS_LABEL[r.status])}</Badge>
      </div>
      <Flash searchParams={sp} />

      {stage >= 0 ? (
        <div className="state-strip" aria-label={t("Fortschritt")}>
          {STAGES.map((s, i) => (
            <span key={s} className={i === stage ? "on" : i < stage ? "done" : undefined} aria-current={i === stage ? "step" : undefined}>{t(s)}</span>
          ))}
        </div>
      ) : (
        <p className="flash error">{t("Dieser Auftrag ist {status}.", { status: t(TRANSFER_STATUS_LABEL[r.status]).toLowerCase() })}</p>
      )}

      <div className="kv-grid">
        <section className="card">
          <h2>{t("Leistung")}</h2>
          <dl className="kv">
            <dt>{t("Fahrgäste")}</dt><dd><Load passengers={r.passengers} luggage={r.luggage} ski={r.skiEquipment} /></dd>
            <dt>{t("Fahrzeug")}</dt><dd>{r.vehicleCategory ? t(VEHICLE_LABEL[r.vehicleCategory]) : t("beliebig, passend zur Gruppe")}</dd>
            {r.childSeats > 0 && <><dt>{t("Kindersitze")}</dt><dd>{r.childSeats}</dd></>}
            {r.specialLuggage && <><dt>{t("Sondergepäck")}</dt><dd>{r.specialLuggage}</dd></>}
            {r.requirements && <><dt>{t("Anforderungen")}</dt><dd>{r.requirements}</dd></>}
            {r.flightNumber && <><dt>{t("Flug")}</dt><dd>{r.flightNumber}{r.flightArrivalAt ? `, Landung ${f.time(r.flightArrivalAt)}` : ""}</dd></>}
            {r.bookingTerms && <><dt>{t("Bedingungen")}</dt><dd>{r.bookingTerms}</dd></>}
            {r.cancellationTerms && <><dt>{t("Storno")}</dt><dd>{r.cancellationTerms}</dd></>}
          </dl>
        </section>

        <section className="card">
          <h2>{t("Preis")}</h2>
          {booking ? (
            <>
              <p className="price-big">{f.money(booking.agreedPriceCents)}</p>
              <p className="price-note">{t("Bestätigter Preis, verbindlich vereinbart am {date}", { date: f.dateTime(booking.acceptedAt) })}</p>
            </>
          ) : (
            <>
              <p className="price-big">
                {r.priceCents ? f.money(r.priceCents) : t("offen")}
              </p>
              <p className="price-note">{t(priceStateLabel(r.priceMode))}{r.quoteDeadline ? ` · ${t("Angebote bis")} ${f.dateTime(r.quoteDeadline)}` : ""}</p>
            </>
          )}
          <p className="price-note">{t("Keine Zahlungsabwicklung über die Plattform.")}</p>
        </section>

        <section className="card">
          <h2>{t("Auftraggeber")}</h2>
          <dl className="kv">
            <dt>{t("Unternehmen")}</dt><dd>{r.requesterOrg.name}, {r.requesterOrg.city} <Badge status="VERIFIED">{t("geprüft")}</Badge></dd>
            {r.requesterOrg.email && <><dt>{t("E-Mail")}</dt><dd>{r.requesterOrg.email}</dd></>}
            {r.requesterOrg.phone && <><dt>{t("Telefon")}</dt><dd>{r.requesterOrg.phone}</dd></>}
            {r.clientReference && <><dt>{t("Ihre Referenz")}</dt><dd>{r.clientReference}</dd></>}
          </dl>
          {role === "market" && <p className="price-note">{t("Adressen, Abholhinweise und Fahrgastdaten werden erst nach der verbindlichen Vergabe sichtbar.")}</p>}
        </section>

        {role !== "market" && (
          <section className="card">
            <h2>{t("Abholung und Fahrgast")}</h2>
            <dl className="kv">
              <dt>{t("Abholadresse")}</dt><dd>{r.pickupAddress ?? t(placeName(r.pickupPlaceId))}</dd>
              <dt>{t("Zieladresse")}</dt><dd>{r.dropoffAddress ?? t(placeName(r.dropoffPlaceId))}</dd>
              {r.pickupNotes && <><dt>{t("Hinweise")}</dt><dd>{r.pickupNotes}</dd></>}
              {contacts.map((c) => <Fragment key={c.id}><dt>{t("Fahrgast")}</dt><dd>{c.name}{c.phone ? `, ${c.phone}` : ""}</dd></Fragment>)}
            </dl>
          </section>
        )}
      </div>

      {role === "market" && r.status === "OPEN" && (
        <section className="card">
          {r.priceMode === "FIXED" && (
            <>
              <h2>{t("Zum Festpreis übernehmen")}</h2>
              <p className="muted">{t("Mit der Übernahme ist der Auftrag verbindlich vergeben. Wer zuerst bestätigt, erhält ihn, eine doppelte Vergabe ist ausgeschlossen.")}</p>
              <form action={takeFixedPriceAction} className="inline">
                <input type="hidden" name="requestId" value={r.id} />
                {vehicles.length > 0 && (
                  <select name="vehicleId" defaultValue="" aria-label={t("Fahrzeug")}>
                    <option value="">{t("Fahrzeug später zuweisen")}</option>
                    {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label} · {t(VEHICLE_LABEL[v.category])} · {t("{n} Plätze", { n: v.seats })}</option>)}
                  </select>
                )}
                <button type="submit" className="accent">{t("Für {price} verbindlich übernehmen", { price: f.money(r.priceCents) })}</button>
              </form>
            </>
          )}
          {r.priceMode === "NEGOTIABLE" && actorCan(actor, "quotes.submit") && (
            <>
              <h2>{myQuote?.status === "SUBMITTED" ? t("Ihr Angebot ändern") : t("Angebot abgeben")}</h2>
              {myQuote && <p><Badge status={myQuote.status}>{t(QUOTE_STATUS_LABEL[myQuote.status])}</Badge> {f.money(myQuote.amountCents)} · {t(VEHICLE_LABEL[myQuote.vehicleCategory])}</p>}
              {(!myQuote || myQuote.status === "SUBMITTED" || myQuote.status === "WITHDRAWN") && (
                <form action={submitQuoteAction} className="stack">
                  <input type="hidden" name="requestId" value={r.id} />
                  <div className="fields">
                    <label>{t("Ihr Preis in €")}<input name="amount" inputMode="decimal" required defaultValue={myQuote ? (myQuote.amountCents / 100).toFixed(2).replace(".", ",") : ""} /></label>
                    <label>{t("Fahrzeug")}<VehicleSelect name="vehicleCategory" required defaultValue={myQuote?.vehicleCategory ?? r.vehicleCategory ?? undefined} /></label>
                    <label>{t("Gültig bis")}<input type="datetime-local" name="validUntil" /></label>
                  </div>
                  <label>{t("Nachricht an den Auftraggeber")}<textarea name="message" rows={2} maxLength={500} defaultValue={myQuote?.message ?? ""} /></label>
                  <div className="inline">
                    <button type="submit" className="accent">{myQuote?.status === "SUBMITTED" ? t("Angebot aktualisieren") : t("Angebot abgeben")}</button>
                  </div>
                </form>
              )}
              {myQuote?.status === "SUBMITTED" && (
                <form action={withdrawQuoteAction} className="gap-top">
                  <input type="hidden" name="requestId" value={r.id} />
                  <input type="hidden" name="quoteId" value={myQuote.id} />
                  <button type="submit" className="link">{t("Angebot zurückziehen")}</button>
                </form>
              )}
              <p className="price-note">{t("Ein Angebot ist erst verbindlich, wenn der Auftraggeber es annimmt.")}</p>
            </>
          )}
        </section>
      )}

      {role === "requester" && r.priceMode === "NEGOTIABLE" && (
        <section className="card">
          <h2>{t("Angebote vergleichen")}</h2>
          {quotes.length === 0 ? <p className="empty">{t("Noch keine Angebote eingegangen.")}</p> : (
            <div className="table-wrap">
              <table className="responsive">
                <thead><tr><th>{t("Anbieter")}</th><th>{t("Fahrzeug")}</th><th>{t("Nachricht")}</th><th className="num">{t("Preis")}</th><th>{t("Status")}</th><th></th></tr></thead>
                <tbody>
                  {quotes.map((q, i) => (
                    <tr key={q.id} className={i === 0 && q.status === "SUBMITTED" ? "match" : undefined}>
                      <td>{q.providerOrg.name}<span className="price-note">{q.providerOrg.city}{q.providerOrg.transportProfile?.fleetSize ? ` · ${t("{n} Fahrzeuge", { n: q.providerOrg.transportProfile.fleetSize })}` : ""} · {t("geprüft")}</span></td>
                      <td data-label={t("Fahrzeug")}>{t(VEHICLE_LABEL[q.vehicleCategory])}</td>
                      <td data-label={t("Nachricht")}>{q.message ?? <span className="muted">–</span>}{q.validUntil && <span className="price-note">gültig bis {f.dateTime(q.validUntil)}</span>}</td>
                      <td className="num price-fixed">{f.money(q.amountCents)}{r.priceCents ? <span className="price-note">{t("Richtpreis")} {f.money(r.priceCents)}</span> : null}</td>
                      <td><Badge status={q.status}>{t(QUOTE_STATUS_LABEL[q.status])}</Badge></td>
                      <td>
                        {r.status === "OPEN" && q.status === "SUBMITTED" && actorCan(actor, "bookings.manage") && (
                          <div className="inline">
                            <form action={acceptQuoteAction}>
                              <input type="hidden" name="requestId" value={r.id} />
                              <input type="hidden" name="quoteId" value={q.id} />
                              <button type="submit">{t("Annehmen")}</button>
                            </form>
                            <form action={rejectQuoteAction}>
                              <input type="hidden" name="requestId" value={r.id} />
                              <input type="hidden" name="quoteId" value={q.id} />
                              <button type="submit" className="link">{t("Ablehnen")}</button>
                            </form>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {r.status === "OPEN" && <p className="price-note">{t("Mit der Annahme wird die Buchung verbindlich, alle anderen Angebote werden automatisch abgelehnt.")}</p>}
        </section>
      )}

      {booking && (
        <section className="card">
          <div className="head-row">
            <h2>{t("Buchung {ref}", { ref: `B-${String(r.number).padStart(6, "0")}` })}</h2>
            <Badge status={booking.status}>{t(BOOKING_STATUS_LABEL[booking.status])}</Badge>
          </div>
          <dl className="kv">
            <dt>{t("Ausführend")}</dt><dd>{booking.providerOrg.name}, {booking.providerOrg.city}</dd>
            {role === "requester" && booking.providerOrg.phone && <><dt>{t("Telefon")}</dt><dd>{booking.providerOrg.phone}</dd></>}
            {role === "requester" && booking.providerOrg.email && <><dt>{t("E-Mail")}</dt><dd>{booking.providerOrg.email}</dd></>}
            <dt>{t("Bestätigter Preis")}</dt><dd className="price-fixed">{f.money(booking.agreedPriceCents)}</dd>
            <dt>{t("Fahrzeug")}</dt><dd>{booking.vehicle ? `${booking.vehicle.label} (${t(VEHICLE_LABEL[booking.vehicle.category])})` : scope?.vehicleCategory ? t(VEHICLE_LABEL[scope.vehicleCategory]) : t("wird vom Unternehmen zugewiesen")}</dd>
            {role === "provider" && (
              <><dt>{t("Fahrer")}</dt><dd>{booking.driver?.name ?? <span className="muted">{t("noch nicht zugewiesen")}</span>}{actorCan(actor, "fleet.manage") && (booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS") && <> · <Link href="/flotte/live#disposition">{t("Disposition")}</Link></>}</dd></>
            )}
            {role === "provider" && booking.tripStage && <><dt>{t("Fortschritt")}</dt><dd>{t(TRIP_STAGE_LABEL[booking.tripStage])}</dd></>}
            <dt>{t("Storno")}</dt><dd>{booking.cancellationTerms ?? "keine gesonderten Bedingungen"}</dd>
            <dt>{t("Vereinbart")}</dt><dd>{f.dateTime(booking.acceptedAt)}{" "}{booking.quoteId ? t("durch Annahme eines Angebots") : t("durch Übernahme zum Festpreis")}</dd>
            {booking.completedAt && <><dt>{t("Abgeschlossen")}</dt><dd>{f.dateTime(booking.completedAt)}{booking.completionNote ? `, ${booking.completionNote}` : ""}</dd></>}
          </dl>
          <p className="price-note">{t("Der Leistungsumfang ist zum Zeitpunkt der Vereinbarung festgehalten und ändert sich nicht mehr.")}</p>
          <div className="actions-row gap-top">
            {role === "provider" && booking.status === "CONFIRMED" && (
              <form action={bookingTransitionAction}>
                <input type="hidden" name="requestId" value={r.id} />
                <input type="hidden" name="bookingId" value={booking.id} />
                <input type="hidden" name="to" value="start" />
                <button type="submit">{t("Fahrt beginnen")}</button>
              </form>
            )}
            {role === "provider" && (booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS") && (
              <form action={bookingTransitionAction} className="inline">
                <input type="hidden" name="requestId" value={r.id} />
                <input type="hidden" name="bookingId" value={booking.id} />
                <input type="hidden" name="to" value="complete" />
                <input name="note" placeholder={t("Notiz, optional")} aria-label={t("Notiz")} />
                <button type="submit" className="secondary">{t("Als durchgeführt melden")}</button>
              </form>
            )}
          </div>
          {booking.status !== "CANCELLED" && booking.status !== "DISPUTED" && (
            <details className="more-actions gap-top">
              <summary>{t("Stornieren oder Problem melden")}</summary>
              <div className="stack gap-top">
                {booking.status === "CONFIRMED" && (
                  <form action={bookingTransitionAction} className="inline">
                    <input type="hidden" name="requestId" value={r.id} />
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <input type="hidden" name="to" value="cancel" />
                    <input name="note" required placeholder={t("Grund der Stornierung")} aria-label={t("Grund der Stornierung")} />
                    <button type="submit" className="danger">{t("Buchung stornieren")}</button>
                  </form>
                )}
                <form action={bookingTransitionAction} className="inline">
                  <input type="hidden" name="requestId" value={r.id} />
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <input type="hidden" name="to" value="dispute" />
                  <input name="note" required placeholder={t("Was ist passiert?")} aria-label={t("Problembeschreibung")} />
                  <button type="submit" className="danger">{t("Problem melden")}</button>
                </form>
              </div>
            </details>
          )}
        </section>
      )}

      {role === "requester" && r.status === "OPEN" && (
        <form action={cancelTransferRequestAction} className="gap-bottom">
          <input type="hidden" name="requestId" value={r.id} />
          <button type="submit" className="danger">{t("Auftrag zurückziehen")}</button>
        </form>
      )}

      {events.length > 0 && (
        <section className="card">
          <h2>{t("Verlauf")}</h2>
          <ol className="timeline">
            {events.map((e) => {
              const d = (e.data ?? {}) as { note?: string; amountCents?: number };
              return (
                <li key={e.id}>
                  <time dateTime={e.createdAt.toISOString()}>{f.dateTime(e.createdAt)}</time>
                  <span>
                    {t(EVENT_LABEL[e.type] ?? e.type)} · {orgName(e.actorOrgId)}
                    {typeof d.amountCents === "number" ? `, ${f.money(d.amountCents)}` : ""}
                    {d.note ? <span className="price-note">„{d.note}“</span> : null}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </AppShell>
  );
}
