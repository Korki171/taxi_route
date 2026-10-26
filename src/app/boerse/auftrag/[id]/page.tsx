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
    orgId === actor.org.id ? "Ihr Unternehmen"
      : orgId === r.requesterOrg.id ? r.requesterOrg.name
      : orgId && orgId === booking?.providerOrgId ? booking.providerOrg.name
      : quotes.find((q) => q.providerOrgId === orgId)?.providerOrg.name ?? "Anbieter";
  const scope = booking?.scope as { vehicleCategory?: VehicleCategory | null } | undefined;

  return (
    <AppShell actor={actor}>
      <p className="muted" style={{ margin: 0 }}>
        <Link href={role === "market" ? "/boerse" : role === "requester" ? "/boerse?view=meine" : "/boerse?view=uebernommen"}>← Zur Börse</Link>
      </p>
      <div className="head-row">
        <div>
          <h1><Route from={r.pickupPlaceId} to={r.dropoffPlaceId} /></h1>
          <p className="sub">
            {referenceOf(r.number)} · Abholung {fmtDateTime(r.pickupAt)}{r.pickupWindowMinutes ? ` ± ${r.pickupWindowMinutes} min` : ""} · Fahrzeit ca. {fmtMinutes(r.estimatedMinutes)}
          </p>
        </div>
        <Badge status={r.status}>{TRANSFER_STATUS_LABEL[r.status]}</Badge>
      </div>
      <Flash searchParams={sp} />

      {stage >= 0 ? (
        <div className="state-strip" aria-label="Fortschritt">
          {STAGES.map((s, i) => (
            <span key={s} className={i === stage ? "on" : i < stage ? "done" : undefined} aria-current={i === stage ? "step" : undefined}>{s}</span>
          ))}
        </div>
      ) : (
        <p className="flash error">Dieser Auftrag ist {TRANSFER_STATUS_LABEL[r.status].toLowerCase()}.</p>
      )}

      <div className="kv-grid">
        <section className="card">
          <h2>Leistung</h2>
          <dl className="kv">
            <dt>Fahrgäste</dt><dd><Load passengers={r.passengers} luggage={r.luggage} ski={r.skiEquipment} /></dd>
            <dt>Fahrzeug</dt><dd>{r.vehicleCategory ? VEHICLE_LABEL[r.vehicleCategory] : "beliebig, passend zur Gruppe"}</dd>
            {r.childSeats > 0 && <><dt>Kindersitze</dt><dd>{r.childSeats}</dd></>}
            {r.specialLuggage && <><dt>Sondergepäck</dt><dd>{r.specialLuggage}</dd></>}
            {r.requirements && <><dt>Anforderungen</dt><dd>{r.requirements}</dd></>}
            {r.flightNumber && <><dt>Flug</dt><dd>{r.flightNumber}{r.flightArrivalAt ? `, Landung ${fmtTime(r.flightArrivalAt)}` : ""}</dd></>}
            {r.bookingTerms && <><dt>Bedingungen</dt><dd>{r.bookingTerms}</dd></>}
            {r.cancellationTerms && <><dt>Storno</dt><dd>{r.cancellationTerms}</dd></>}
          </dl>
        </section>

        <section className="card">
          <h2>Preis</h2>
          {booking ? (
            <>
              <p className="price-fixed" style={{ fontSize: 24, margin: "0 0 4px" }}>{formatCents(booking.agreedPriceCents)}</p>
              <p className="price-note">Bestätigter Preis, verbindlich vereinbart am {fmtDateTime(booking.acceptedAt)}</p>
            </>
          ) : (
            <>
              <p className={r.priceMode === "FIXED" ? "price-fixed" : "price-guide"} style={{ fontSize: 24, margin: "0 0 4px" }}>
                {r.priceCents ? formatCents(r.priceCents) : "offen"}
              </p>
              <p className="price-note">{priceStateLabel(r.priceMode)}{r.quoteDeadline ? ` · Angebote bis ${fmtDateTime(r.quoteDeadline)}` : ""}</p>
            </>
          )}
          <p className="price-note">Keine Zahlungsabwicklung über die Plattform.</p>
        </section>

        <section className="card">
          <h2>Auftraggeber</h2>
          <dl className="kv">
            <dt>Unternehmen</dt><dd>{r.requesterOrg.name}, {r.requesterOrg.city} <Badge status="VERIFIED">geprüft</Badge></dd>
            {r.requesterOrg.email && <><dt>E-Mail</dt><dd>{r.requesterOrg.email}</dd></>}
            {r.requesterOrg.phone && <><dt>Telefon</dt><dd>{r.requesterOrg.phone}</dd></>}
            {r.clientReference && <><dt>Ihre Referenz</dt><dd>{r.clientReference}</dd></>}
          </dl>
          {role === "market" && <p className="price-note">Adressen, Abholhinweise und Fahrgastdaten werden erst nach der verbindlichen Vergabe sichtbar.</p>}
        </section>

        {role !== "market" && (
          <section className="card">
            <h2>Abholung und Fahrgast</h2>
            <dl className="kv">
              <dt>Abholadresse</dt><dd>{r.pickupAddress ?? placeName(r.pickupPlaceId)}</dd>
              <dt>Zieladresse</dt><dd>{r.dropoffAddress ?? placeName(r.dropoffPlaceId)}</dd>
              {r.pickupNotes && <><dt>Hinweise</dt><dd>{r.pickupNotes}</dd></>}
              {contacts.map((c) => <Fragment key={c.id}><dt>Fahrgast</dt><dd>{c.name}{c.phone ? `, ${c.phone}` : ""}</dd></Fragment>)}
            </dl>
          </section>
        )}
      </div>

      {role === "market" && r.status === "OPEN" && (
        <section className="card">
          {r.priceMode === "FIXED" && (
            <>
              <h2>Zum Festpreis übernehmen</h2>
              <p className="muted">Mit der Übernahme ist der Auftrag verbindlich vergeben. Wer zuerst bestätigt, erhält ihn, eine doppelte Vergabe ist ausgeschlossen.</p>
              <form action={takeFixedPriceAction} className="inline">
                <input type="hidden" name="requestId" value={r.id} />
                {vehicles.length > 0 && (
                  <select name="vehicleId" defaultValue="" aria-label="Fahrzeug">
                    <option value="">Fahrzeug später zuweisen</option>
                    {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label} · {VEHICLE_LABEL[v.category]} · {v.seats} Plätze</option>)}
                  </select>
                )}
                <button type="submit">Für {formatCents(r.priceCents)} verbindlich übernehmen</button>
              </form>
            </>
          )}
          {r.priceMode === "NEGOTIABLE" && actorCan(actor, "quotes.submit") && (
            <>
              <h2>{myQuote?.status === "SUBMITTED" ? "Ihr Angebot ändern" : "Angebot abgeben"}</h2>
              {myQuote && <p><Badge status={myQuote.status}>{QUOTE_STATUS_LABEL[myQuote.status]}</Badge> {formatCents(myQuote.amountCents)} · {VEHICLE_LABEL[myQuote.vehicleCategory]}</p>}
              {(!myQuote || myQuote.status === "SUBMITTED" || myQuote.status === "WITHDRAWN") && (
                <form action={submitQuoteAction} className="stack">
                  <input type="hidden" name="requestId" value={r.id} />
                  <div className="fields">
                    <label>Ihr Preis in €<input name="amount" inputMode="decimal" required defaultValue={myQuote ? (myQuote.amountCents / 100).toFixed(2).replace(".", ",") : ""} /></label>
                    <label>Fahrzeug<VehicleSelect name="vehicleCategory" required defaultValue={myQuote?.vehicleCategory ?? r.vehicleCategory ?? undefined} /></label>
                    <label>Gültig bis<input type="datetime-local" name="validUntil" /></label>
                  </div>
                  <label>Nachricht an den Auftraggeber<textarea name="message" rows={2} maxLength={500} defaultValue={myQuote?.message ?? ""} /></label>
                  <div className="inline">
                    <button type="submit">{myQuote?.status === "SUBMITTED" ? "Angebot aktualisieren" : "Angebot abgeben"}</button>
                  </div>
                </form>
              )}
              {myQuote?.status === "SUBMITTED" && (
                <form action={withdrawQuoteAction} style={{ marginTop: 8 }}>
                  <input type="hidden" name="requestId" value={r.id} />
                  <input type="hidden" name="quoteId" value={myQuote.id} />
                  <button type="submit" className="link">Angebot zurückziehen</button>
                </form>
              )}
              <p className="price-note">Ein Angebot ist erst verbindlich, wenn der Auftraggeber es annimmt.</p>
            </>
          )}
        </section>
      )}

      {role === "requester" && r.priceMode === "NEGOTIABLE" && (
        <section className="card">
          <h2>Angebote vergleichen</h2>
          {quotes.length === 0 ? <p className="empty">Noch keine Angebote eingegangen.</p> : (
            <div className="table-wrap">
              <table className="responsive">
                <thead><tr><th>Anbieter</th><th>Fahrzeug</th><th>Nachricht</th><th className="num">Preis</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {quotes.map((q, i) => (
                    <tr key={q.id} className={i === 0 && q.status === "SUBMITTED" ? "match" : undefined}>
                      <td>{q.providerOrg.name}<span className="price-note">{q.providerOrg.city}{q.providerOrg.transportProfile?.fleetSize ? ` · ${q.providerOrg.transportProfile.fleetSize} Fahrzeuge` : ""} · geprüft</span></td>
                      <td data-label="Fahrzeug">{VEHICLE_LABEL[q.vehicleCategory]}</td>
                      <td data-label="Nachricht">{q.message ?? <span className="muted">–</span>}{q.validUntil && <span className="price-note">gültig bis {fmtDateTime(q.validUntil)}</span>}</td>
                      <td className="num price-fixed">{formatCents(q.amountCents)}{r.priceCents ? <span className="price-note">Richtpreis {formatCents(r.priceCents)}</span> : null}</td>
                      <td><Badge status={q.status}>{QUOTE_STATUS_LABEL[q.status]}</Badge></td>
                      <td>
                        {r.status === "OPEN" && q.status === "SUBMITTED" && actorCan(actor, "bookings.manage") && (
                          <div className="inline">
                            <form action={acceptQuoteAction}>
                              <input type="hidden" name="requestId" value={r.id} />
                              <input type="hidden" name="quoteId" value={q.id} />
                              <button type="submit">Annehmen</button>
                            </form>
                            <form action={rejectQuoteAction}>
                              <input type="hidden" name="requestId" value={r.id} />
                              <input type="hidden" name="quoteId" value={q.id} />
                              <button type="submit" className="link">Ablehnen</button>
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
          {r.status === "OPEN" && <p className="price-note">Mit der Annahme wird die Buchung verbindlich, alle anderen Angebote werden automatisch abgelehnt.</p>}
        </section>
      )}

      {booking && (
        <section className="card">
          <div className="head-row">
            <h2>Buchung B-{String(r.number).padStart(6, "0")}</h2>
            <Badge status={booking.status}>{BOOKING_STATUS_LABEL[booking.status]}</Badge>
          </div>
          <dl className="kv">
            <dt>Ausführend</dt><dd>{booking.providerOrg.name}, {booking.providerOrg.city}</dd>
            {role === "requester" && booking.providerOrg.phone && <><dt>Telefon</dt><dd>{booking.providerOrg.phone}</dd></>}
            {role === "requester" && booking.providerOrg.email && <><dt>E-Mail</dt><dd>{booking.providerOrg.email}</dd></>}
            <dt>Bestätigter Preis</dt><dd className="price-fixed">{formatCents(booking.agreedPriceCents)}</dd>
            <dt>Fahrzeug</dt><dd>{booking.vehicle ? `${booking.vehicle.label} (${VEHICLE_LABEL[booking.vehicle.category]})` : scope?.vehicleCategory ? VEHICLE_LABEL[scope.vehicleCategory] : "wird vom Unternehmen zugewiesen"}</dd>
            <dt>Storno</dt><dd>{booking.cancellationTerms ?? "keine gesonderten Bedingungen"}</dd>
            <dt>Vereinbart</dt><dd>{fmtDateTime(booking.acceptedAt)}{booking.quoteId ? " durch Annahme eines Angebots" : " durch Übernahme zum Festpreis"}</dd>
            {booking.completedAt && <><dt>Abgeschlossen</dt><dd>{fmtDateTime(booking.completedAt)}{booking.completionNote ? `, ${booking.completionNote}` : ""}</dd></>}
          </dl>
          <p className="price-note">Der Leistungsumfang ist zum Zeitpunkt der Vereinbarung festgehalten und ändert sich nicht mehr.</p>
          <div className="inline" style={{ marginTop: 12 }}>
            {role === "provider" && booking.status === "CONFIRMED" && (
              <form action={bookingTransitionAction}>
                <input type="hidden" name="requestId" value={r.id} />
                <input type="hidden" name="bookingId" value={booking.id} />
                <input type="hidden" name="to" value="start" />
                <button type="submit">Fahrt beginnen</button>
              </form>
            )}
            {role === "provider" && (booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS") && (
              <form action={bookingTransitionAction} className="inline">
                <input type="hidden" name="requestId" value={r.id} />
                <input type="hidden" name="bookingId" value={booking.id} />
                <input type="hidden" name="to" value="complete" />
                <input name="note" placeholder="Notiz, optional" aria-label="Notiz" />
                <button type="submit" className="secondary">Als durchgeführt melden</button>
              </form>
            )}
          </div>
          {booking.status !== "CANCELLED" && booking.status !== "DISPUTED" && (
            <details style={{ marginTop: 12 }}>
              <summary>Stornieren oder Problem melden</summary>
              <div className="stack" style={{ marginTop: 8 }}>
                {booking.status === "CONFIRMED" && (
                  <form action={bookingTransitionAction} className="inline">
                    <input type="hidden" name="requestId" value={r.id} />
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <input type="hidden" name="to" value="cancel" />
                    <input name="note" required placeholder="Grund der Stornierung" aria-label="Grund der Stornierung" />
                    <button type="submit" className="danger">Buchung stornieren</button>
                  </form>
                )}
                <form action={bookingTransitionAction} className="inline">
                  <input type="hidden" name="requestId" value={r.id} />
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <input type="hidden" name="to" value="dispute" />
                  <input name="note" required placeholder="Was ist passiert?" aria-label="Problembeschreibung" />
                  <button type="submit" className="danger">Problem melden</button>
                </form>
              </div>
            </details>
          )}
        </section>
      )}

      {role === "requester" && r.status === "OPEN" && (
        <form action={cancelTransferRequestAction} style={{ marginBottom: 16 }}>
          <input type="hidden" name="requestId" value={r.id} />
          <button type="submit" className="danger">Auftrag zurückziehen</button>
        </form>
      )}

      {events.length > 0 && (
        <section className="card">
          <h2>Verlauf</h2>
          <ol className="timeline">
            {events.map((e) => {
              const d = (e.data ?? {}) as { note?: string; amountCents?: number };
              return (
                <li key={e.id}>
                  <time dateTime={e.createdAt.toISOString()}>{fmtDateTime(e.createdAt)}</time>
                  <span>
                    {EVENT_LABEL[e.type] ?? e.type} · {orgName(e.actorOrgId)}
                    {typeof d.amountCents === "number" ? `, ${formatCents(d.amountCents)}` : ""}
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
