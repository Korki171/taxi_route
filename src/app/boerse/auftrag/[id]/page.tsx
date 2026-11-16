import { ShareLink } from "@/components/ShareLink";
import { EscalateSelect } from "@/components/EscalateSelect";
import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import type { VehicleCategory } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { Load, ProviderPicker, Route, VehicleSelect } from "@/components/market";
import { Badge, Flash, Stars, type SP } from "@/components/ui";
import { fmtDateTime, fmtMinutes, fmtTime } from "@/lib/format";
import {
  BOOKING_STATUS_LABEL,
  INVITATION_STATUS_LABEL,
  TRIP_STAGE_LABEL,
  QUOTE_STATUS_LABEL,
  TRANSFER_STATUS_LABEL,
  VEHICLE_LABEL,
  priceStateLabel,
} from "@/lib/labels";
import { cancelRuleText, freeCancelUntil, lateCancelFeeCents, noShowAllowedFrom } from "@/lib/cancellation";
import { splitHandoff } from "@/lib/handoff";
import { formatCents } from "@/lib/money";
import { placeName } from "@/lib/places";
import { actorCan } from "@/server/authz/context";
import { appUrl } from "@/server/email";
import { AppError } from "@/server/errors";
import { listVehicles } from "@/server/services/fleet";
import { escalateDueRequests } from "@/server/services/partners";
import { listThreads } from "@/server/services/messages";
import { listBookingDocuments } from "@/server/services/booking-extras";
import { listBookingRatings, ratingSummaries } from "@/server/services/ratings";
import { getTransferRequest, listProviderDirectory, MAX_INVITATIONS, referenceOf } from "@/server/services/marketplace";
import { EVENT_LABEL } from "@/server/services/transfer-events";
import { requireOrgActor } from "@/server/web";
import { getI18n } from "@/server/i18n";
import {
  acceptQuoteAction,
  advanceAudienceAction,
  setEscalationAction,
  bookingTransitionAction,
  cancelTransferRequestAction,
  declineInvitationAction,
  inviteProvidersAction,
  rateBookingAction,
  openToMarketAction,
  rejectQuoteAction,
  submitQuoteAction,
  takeFixedPriceAction,
  sendMessageAction,
  takeOwnRequestAction,
  uploadBookingDocumentAction,
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
  await escalateDueRequests().catch(() => 0);
  const data = await getTransferRequest(actor, id).catch((e) => {
    if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
    throw e;
  });
  const { role, request: r, contacts, quotes, events, invitations } = data;
  const myInvitation = role === "market" ? invitations[0] : undefined;
  const canInvite = role === "requester" && r.status === "OPEN" && actorCan(actor, "transfers.request") && invitations.length < MAX_INVITATIONS;
  const invitedIds = new Set(invitations.map((i) => i.providerOrgId));
  const moreProviders = canInvite ? (await listProviderDirectory(actor)).filter((p) => !invitedIds.has(p.id)) : [];
  const booking = r.booking;
  const myQuote = role === "market" ? quotes[0] : undefined;
  const openQuotes = quotes.filter((q) => q.status === "SUBMITTED");
  const vehicles = role === "market" && actorCan(actor, "fleet.manage") ? (await listVehicles(actor)).filter((v) => v.active) : [];
  const stage = stageIndex(r.status, role === "requester" ? openQuotes.length > 0 : !!myQuote);
  const orgName = (orgId: string | null) =>
    orgId === actor.org.id ? t("Ihr Unternehmen")
      : orgId === r.requesterOrg.id ? r.requesterOrg.name
      : orgId && orgId === booking?.providerOrgId ? booking.providerOrg.name
      : quotes.find((q) => q.providerOrgId === orgId)?.providerOrg.name
        ?? invitations.find((i) => i.providerOrgId === orgId)?.providerOrg.name ?? t("Anbieter");
  const chat = await listThreads(actor, id).catch(() => null);
  // Storno und No-Show (Regeln in src/lib/cancellation.ts)
  const now = new Date();
  const cancelFee = booking ? lateCancelFeeCents(booking, r.pickupAt, booking.agreedPriceCents, now) : 0;
  const freeUntil = booking ? freeCancelUntil(booking, r.pickupAt) : null;
  const noShowOpen = !!booking && booking.status === "IN_PROGRESS" && booking.tripStage === "AT_PICKUP" && now >= noShowAllowedFrom(r.pickupAt) && actorCan(actor, "jobs.accept");
  const bookingDocs = booking && booking.status !== "CANCELLED" ? await listBookingDocuments(actor, booking.id) : [];
  const canDocs = !!booking && booking.status !== "CANCELLED" && (actorCan(actor, "bookings.manage") || actorCan(actor, "jobs.accept"));
  // Bewertungen: Schnitt je Firma und die Bewertungen zu dieser Buchung
  const stars = await ratingSummaries([r.requesterOrg.id, ...(booking ? [booking.providerOrgId] : []), ...quotes.map((q) => q.providerOrgId)]);
  const rateable = !!booking && booking.status === "COMPLETED" && booking.providerOrgId !== booking.requesterOrgId;
  const ratings = rateable ? await listBookingRatings(actor, booking.id) : [];
  const myRating = ratings.find((x) => x.fromOrgId === actor.org.id);
  const theirRating = ratings.find((x) => x.toOrgId === actor.org.id);
  const canRate = rateable && !myRating && (actorCan(actor, "bookings.manage") || actorCan(actor, "jobs.accept"));
  const otherName = booking ? (role === "requester" ? booking.providerOrg.name : r.requesterOrg.name) : "";
  // Live-Status-Link für Auftraggeber und Fahrgast (ohne Login), solange die Buchung aktiv ist
  const trackUrl = booking && (booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS") ? appUrl(`/t/${booking.trackToken}`) : null;
  const scope = booking?.scope as { vehicleCategory?: VehicleCategory | null } | undefined;
  const share = r.handoffSharePercent;
  const giver = role === "requester" ? t("Ihr Unternehmen") : r.requesterOrg.name;
  const listedSplit = share > 0 && r.priceCents ? splitHandoff(r.priceCents, share) : null;

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
        <div className="inline">
          {r.visibility === "INVITED" && <span className="badge neutral">{t("Gezielte Anfrage")}</span>}
          <Badge status={r.status}>{t(TRANSFER_STATUS_LABEL[r.status])}</Badge>
        </div>
      </div>
      <Flash searchParams={sp} />

      {myInvitation?.status === "PENDING" && r.status === "OPEN" && (
        <section className="card">
          <h2>{t("Direktanfrage von {org}", { org: r.requesterOrg.name })}</h2>
          <p className="muted">{t("{org} bittet Ihr Unternehmen gezielt um ein Angebot. Geben Sie unten ein Angebot ab oder lehnen Sie ab, damit der Auftraggeber rechtzeitig weitersuchen kann.", { org: r.requesterOrg.name })}</p>
          <form action={declineInvitationAction} className="inline decline">
            <input type="hidden" name="requestId" value={r.id} />
            <input name="note" maxLength={300} placeholder={t("Grund, optional (z. B. kein Fahrzeug frei)")} aria-label={t("Grund der Ablehnung")} />
            <button type="submit" className="secondary">{t("Anfrage ablehnen")}</button>
          </form>
        </section>
      )}

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
            {(cancelRuleText(t, r) || r.cancellationTerms) && <><dt>{t("Storno")}</dt><dd>{[cancelRuleText(t, r), r.cancellationTerms].filter(Boolean).join(" ")}</dd></>}
          </dl>
        </section>

        <section className="card">
          <h2>{t("Preis")}</h2>
          {booking ? (
            <>
              <p className="price-big">{f.money(booking.agreedPriceCents)}</p>
              <p className="price-note">{t("Bestätigter Preis, verbindlich vereinbart am {date}", { date: f.dateTime(booking.acceptedAt) })}</p>
              {booking.handoffShareCents > 0 && (
                <dl className="kv handoff-split">
                  <dt>{t("Abgabe-Anteil ({p} %)", { p: booking.handoffSharePercent })}</dt><dd>{f.money(booking.handoffShareCents)} {t("für {org}", { org: giver })}</dd>
                  <dt>{t("Ausführendes Unternehmen")}</dt><dd className="price-fixed">{f.money(booking.agreedPriceCents - booking.handoffShareCents)}</dd>
                </dl>
              )}
            </>
          ) : (
            <>
              <p className="price-big">
                {r.priceCents ? f.money(r.priceCents) : t("offen")}
              </p>
              <p className="price-note">{t(priceStateLabel(r.priceMode))}{r.quoteDeadline ? ` · ${t("Angebote bis")} ${f.dateTime(r.quoteDeadline)}` : ""}</p>
              {share > 0 && (
                <dl className="kv handoff-split">
                  <dt>{t("Abgabe-Anteil")}</dt><dd>{t("{p} % für {org}", { p: share, org: giver })}{listedSplit ? `, ${f.money(listedSplit.shareCents)}` : ""}</dd>
                  <dt>{t("Für den Übernehmer")}</dt><dd className="price-fixed">{listedSplit ? f.money(listedSplit.providerCents) : t("Preis minus {p} %", { p: share })}</dd>
                </dl>
              )}
            </>
          )}
          {(share > 0 || (booking?.handoffShareCents ?? 0) > 0) && <p className="price-note">{t("Den Anteil rechnen die Unternehmen direkt miteinander ab. Transferborsa erhält davon nichts.")}</p>}
          <p className="price-note">{t("Keine Zahlungsabwicklung über die Plattform.")}</p>
        </section>

        <section className="card">
          <h2>{t("Auftraggeber")}</h2>
          <dl className="kv">
            <dt>{t("Unternehmen")}</dt><dd>{r.requesterOrg.name}, {r.requesterOrg.city} <Badge status="VERIFIED">{t(r.requesterOrg.type === "TRANSPORT_COMPANY" ? "Konzession geprüft" : "geprüft")}</Badge> <Stars rating={stars.get(r.requesterOrg.id)} /></dd>
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
              {listedSplit && <p className="price-note price-share">{t("{org} behält {p} % ({share}). Sie fahren für {amount}.", { org: r.requesterOrg.name, p: share, share: f.money(listedSplit.shareCents), amount: f.money(listedSplit.providerCents) })}</p>}
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
              {myQuote && <p><Badge status={myQuote.status}>{t(QUOTE_STATUS_LABEL[myQuote.status])}</Badge> {f.money(myQuote.amountCents)} · {t(VEHICLE_LABEL[myQuote.vehicleCategory])}{share > 0 ? ` · ${t("Sie erhalten {amount}", { amount: f.money(splitHandoff(myQuote.amountCents, share).providerCents) })}` : ""}</p>}
              {share > 0 && <p className="price-note price-share">{t("Ihr Preis ist der Fahrpreis. Davon behält {org} {p} % als Abgabe-Anteil.", { org: r.requesterOrg.name, p: share })}</p>}
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
                      <td>{q.providerOrg.name}<span className="price-note">{q.providerOrg.city}{q.providerOrg.transportProfile?.fleetSize ? ` · ${t("{n} Fahrzeuge", { n: q.providerOrg.transportProfile.fleetSize })}` : ""}</span><Badge status="VERIFIED">{t("Konzession geprüft")}</Badge> <Stars rating={stars.get(q.providerOrgId)} /></td>
                      <td data-label={t("Fahrzeug")}>{t(VEHICLE_LABEL[q.vehicleCategory])}</td>
                      <td data-label={t("Nachricht")}>{q.message ?? <span className="muted">–</span>}{q.validUntil && <span className="price-note">gültig bis {f.dateTime(q.validUntil)}</span>}</td>
                      <td className="num price-fixed">{f.money(q.amountCents)}{share > 0 && <span className="price-note price-share">{t("Ihr Anteil {amount}", { amount: f.money(splitHandoff(q.amountCents, share).shareCents) })}</span>}{r.priceCents ? <span className="price-note">{t("Richtpreis")} {f.money(r.priceCents)}</span> : null}</td>
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

      {role === "requester" && (invitations.length > 0 || r.status === "OPEN") && (
        <section className="card">
          <div className="head-row">
            <h2>{t("Angefragte Unternehmen")}</h2>
            <span className="muted">{t(r.visibility === "INVITED" ? "Nur diese Unternehmen sehen den Auftrag." : "Der Auftrag steht zusätzlich in der ganzen Börse.")}</span>
          </div>
          {invitations.length === 0 ? <p className="empty">{t("Noch keine Unternehmen gezielt angefragt.")}</p> : (
            <table className="responsive">
              <tbody>
                {invitations.map((i) => (
                  <tr key={i.id}>
                    <td>{i.providerOrg.name}<span className="price-note">{i.providerOrg.city}</span></td>
                    <td data-label={t("Angefragt")}>{f.dateTime(i.createdAt)}</td>
                    <td>
                      <Badge status={i.status}>{t(INVITATION_STATUS_LABEL[i.status])}</Badge>
                      {i.declineNote && <span className="price-note">„{i.declineNote}“</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {r.visibility === "INVITED" && r.status === "OPEN" && (
            <form action={openToMarketAction} className="gap-top">
              <input type="hidden" name="requestId" value={r.id} />
              <button type="submit" className="secondary">{t("Für die ganze Börse freigeben")}</button>
            </form>
          )}
          {canInvite && moreProviders.length > 0 && (
            <details className="more-actions gap-top">
              <summary>{t("Weitere Unternehmen anfragen")}</summary>
              <form action={inviteProvidersAction} className="stack gap-top">
                <input type="hidden" name="requestId" value={r.id} />
                <ProviderPicker providers={moreProviders} />
                <div><button type="submit">{t("Ausgewählte anfragen")}</button></div>
              </form>
            </details>
          )}
        </section>
      )}

      {booking && (
        <section className="card">
          <div className="head-row">
            <h2>{t("Buchung {ref}", { ref: `B-${String(r.number).padStart(6, "0")}` })}</h2>
            <Badge status={booking.status}>{t(BOOKING_STATUS_LABEL[booking.status])}</Badge>
          </div>
          <dl className="kv">
            <dt>{t("Ausführend")}</dt><dd>{booking.providerOrg.name}, {booking.providerOrg.city} <Badge status="VERIFIED">{t("Konzession geprüft")}</Badge> <Stars rating={stars.get(booking.providerOrgId)} /></dd>
            {role === "requester" && booking.providerOrg.phone && <><dt>{t("Telefon")}</dt><dd>{booking.providerOrg.phone}</dd></>}
            {role === "requester" && booking.providerOrg.email && <><dt>{t("E-Mail")}</dt><dd>{booking.providerOrg.email}</dd></>}
            <dt>{t("Bestätigter Preis")}</dt><dd className="price-fixed">{f.money(booking.agreedPriceCents)}</dd>
            {booking.handoffShareCents > 0 && (
              <>
                <dt>{t("Abgabe-Anteil ({p} %)", { p: booking.handoffSharePercent })}</dt><dd>{f.money(booking.handoffShareCents)} {t("für {org}", { org: giver })}</dd>
                <dt>{t("Ausführendes Unternehmen")}</dt><dd>{f.money(booking.agreedPriceCents - booking.handoffShareCents)}</dd>
              </>
            )}
            <dt>{t("Fahrzeug")}</dt><dd>{booking.vehicle ? `${booking.vehicle.label} (${t(VEHICLE_LABEL[booking.vehicle.category])})` : scope?.vehicleCategory ? t(VEHICLE_LABEL[scope.vehicleCategory]) : t("wird vom Unternehmen zugewiesen")}</dd>
            {role === "provider" && (
              <><dt>{t("Fahrer")}</dt><dd>{booking.driver?.name ?? <span className="muted">{t("noch nicht zugewiesen")}</span>}{actorCan(actor, "fleet.manage") && (booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS") && <> · <Link href="/flotte/live#disposition">{t("Disposition")}</Link></>}</dd></>
            )}
            {booking.tripStage && <><dt>{t("Fortschritt")}</dt><dd>{t(TRIP_STAGE_LABEL[booking.tripStage])}</dd></>}
            <dt>{t("Storno")}</dt><dd>{[cancelRuleText(t, booking), booking.cancellationTerms].filter(Boolean).join(" ") || t("keine gesonderten Bedingungen")}</dd>
            {booking.feeCents != null && booking.feeCents > 0 && (
              <><dt>{booking.status === "NO_SHOW" ? t("No-Show-Gebühr") : t("Stornogebühr")}</dt><dd className="price-fixed">{f.money(booking.feeCents)} <span className="price-note">{t("an {org}, direkt abzurechnen", { org: booking.providerOrg.name })}</span></dd></>
            )}
            <dt>{t("Vereinbart")}</dt><dd>{f.dateTime(booking.acceptedAt)}{" "}{booking.quoteId ? t("durch Annahme eines Angebots") : t("durch Übernahme zum Festpreis")}</dd>
            {booking.completedAt && <><dt>{t("Abgeschlossen")}</dt><dd>{f.dateTime(booking.completedAt)}{booking.completionNote ? `, ${booking.completionNote}` : ""}</dd></>}
          </dl>
          <p className="price-note">{t("Der Leistungsumfang ist zum Zeitpunkt der Vereinbarung festgehalten und ändert sich nicht mehr.")}</p>
          <div className="actions-row gap-top">
            <a href={`/api/bookings/${booking.id}/confirmation`} className="btn secondary" target="_blank" rel="noopener">{t("Auftragsbestätigung (PDF)")}</a>
            {trackUrl && (
              <>
                <a href={trackUrl} className="btn secondary" target="_blank" rel="noopener">{t("Live-Status")}</a>
                <a href={`https://wa.me/?text=${encodeURIComponent(t("Ihre Fahrt {route} live verfolgen: {url}", { route: `${t(placeName(r.pickupPlaceId))} → ${t(placeName(r.dropoffPlaceId))}`, url: trackUrl }))}`} className="btn secondary" target="_blank" rel="noopener">{t("Link per WhatsApp senden")}</a>
              </>
            )}
            {role === "provider" && booking.status === "CONFIRMED" && (
              <form action={bookingTransitionAction}>
                <input type="hidden" name="requestId" value={r.id} />
                <input type="hidden" name="bookingId" value={booking.id} />
                <input type="hidden" name="to" value="start" />
                <button type="submit">{t("Fahrt beginnen")}</button>
              </form>
            )}
            {role === "provider" && noShowOpen && (
              <form action={bookingTransitionAction}>
                <input type="hidden" name="requestId" value={r.id} />
                <input type="hidden" name="bookingId" value={booking.id} />
                <input type="hidden" name="to" value="no_show" />
                <button type="submit" className="danger">{t("Fahrgast nicht erschienen")}</button>
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
                {role === "provider" && booking.status === "CONFIRMED" && r.pickupAt > new Date() && (
                  <form action={bookingTransitionAction} className="inline">
                    <input type="hidden" name="requestId" value={r.id} />
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <input type="hidden" name="to" value="return" />
                    <input name="note" required placeholder={t("Grund der Rückgabe")} aria-label={t("Grund der Rückgabe")} />
                    <button type="submit" className="danger">{t("Auftrag zurückgeben")}</button>
                  </form>
                )}
                {booking.status === "CONFIRMED" && role === "requester" && (
                  <p className="flush">
                    {cancelFee > 0
                      ? t("Die kostenlose Stornofrist ist vorbei. Storno jetzt: {fee} an {org}.", { fee: f.money(cancelFee), org: booking.providerOrg.name })
                      : freeUntil
                        ? t("Kostenlos stornierbar bis {when}.", { when: f.dateTime(freeUntil) })
                        : t("Für diese Buchung gilt keine feste Stornogebühr.")}
                  </p>
                )}
                {booking.status === "CONFIRMED" && (role === "requester" || r.pickupAt <= new Date()) && (
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

      {rateable && (canRate || myRating || theirRating) && (
        <section className="card stack" id="bewertung">
          <h2>{t("Bewertung")}</h2>
          {canRate && (
            <form action={rateBookingAction} className="stack">
              <input type="hidden" name="requestId" value={r.id} />
              <input type="hidden" name="bookingId" value={booking.id} />
              <fieldset className="star-pick">
                <legend>{t("Wie war die Zusammenarbeit mit {org}?", { org: otherName })}</legend>
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n}><input type="radio" name="stars" value={n} required defaultChecked={n === 5} /> {"★".repeat(n)}</label>
                ))}
              </fieldset>
              <label>{t("Kommentar, optional")}<input name="comment" maxLength={300} placeholder={t("z. B. pünktlich, sauberes Fahrzeug, schnell bezahlt")} /></label>
              <div><button type="submit">{t("Bewertung abgeben")}</button></div>
            </form>
          )}
          {myRating && <p className="flush">{t("Ihre Bewertung für {org}:", { org: otherName })} <span className="stars">{"★".repeat(myRating.stars)}</span>{myRating.comment ? ` „${myRating.comment}“` : ""}</p>}
          {theirRating && <p className="flush">{t("{org} hat Sie bewertet:", { org: otherName })} <span className="stars">{"★".repeat(theirRating.stars)}</span>{theirRating.comment ? ` „${theirRating.comment}“` : ""}</p>}
          <p className="price-note">{t("Bewertungen sind für alle Betriebe als Schnitt sichtbar und lassen sich nicht mehr ändern.")}</p>
        </section>
      )}

      {role === "requester" && r.status === "OPEN" && r.visibility === "MARKET" && (
        <section className="card">
          <h2>{t("Wer sieht diesen Auftrag?")}</h2>
          <p>
            <Badge status={r.audience === "MARKET" ? "VERIFIED" : "PENDING"}>
              {t(r.audience === "OWN" ? "Nur Ihr Betrieb" : r.audience === "PARTNERS" ? "Ihre Partner" : "Gesamte Börse")}
            </Badge>
            {r.audience !== "MARKET" && r.escalateAfterMinutes != null && (
              <> {t("Automatisch weiter am {time}", { time: f.dateTime(new Date(r.audienceSince.getTime() + r.escalateAfterMinutes * 60_000)) })}</>
            )}
          </p>
          <ShareLink
            url={appUrl(`/a/${r.shareToken}`)}
            text={t("Fahrt abzugeben: {route}, {pickup}, {pax} Pers., {price}. Details und Übernehmen:", {
              route: `${t(placeName(r.pickupPlaceId))} → ${t(placeName(r.dropoffPlaceId))}`,
              pickup: f.dateTime(r.pickupAt),
              pax: r.passengers,
              price: r.priceCents != null ? `${t(r.priceMode === "FIXED" ? "Festpreis" : "Richtpreis")} ${f.money(r.priceCents)}` : t("Preis auf Anfrage"),
            })}
            label={t("In WhatsApp-Gruppe teilen")}
            copied={t("Link kopiert")}
            whatsapp={t("WhatsApp")}
          />
          <p className="price-note">{t("Wer den Link öffnet, sieht Strecke, Zeit und Preis ohne Anmeldung, aber keine Adressen und keine Fahrgastdaten.")}</p>
          {r.audience !== "MARKET" && (
            <form action={setEscalationAction} className="actions-row">
              <input type="hidden" name="requestId" value={r.id} />
              <label>{t("Automatisch weitergeben nach")}<EscalateSelect name="escalateAfterMinutes" value={r.escalateAfterMinutes} /></label>
              <button type="submit" className="secondary">{t("Speichern")}</button>
            </form>
          )}
          <div className="actions-row">
            {actorCan(actor, "jobs.accept") && (
              <form action={takeOwnRequestAction}>
                <input type="hidden" name="requestId" value={r.id} />
                <button type="submit" className="accent">{t("Selbst fahren")}</button>
              </form>
            )}
            {r.audience !== "MARKET" && (
              <form action={advanceAudienceAction}>
                <input type="hidden" name="requestId" value={r.id} />
                <button type="submit" className="secondary">{t(r.audience === "OWN" ? "Jetzt an Partner weitergeben" : "Jetzt an die ganze Börse")}</button>
              </form>
            )}
          </div>
        </section>
      )}

      {role === "requester" && r.status === "OPEN" && (
        <form action={cancelTransferRequestAction} className="gap-bottom">
          <input type="hidden" name="requestId" value={r.id} />
          <button type="submit" className="danger">{t("Auftrag zurückziehen")}</button>
        </form>
      )}

      {chat && chat.threads.length > 0 && (
        <section className="card stack" id="nachrichten">
          <h2>{t("Nachrichten")}</h2>
          {chat.role === "counterpart" && chat.threads[0].messages.length === 0 && (
            <p className="muted">{t("Rückfragen zum Auftrag stellen Sie hier direkt dem Auftraggeber.")}</p>
          )}
          {chat.threads.map((th) => (
            <div key={th.threadOrgId} className="stack">
              {th.withName && <h3>{th.withName}</h3>}
              {th.messages.length > 0 && (
                <ol className="timeline">
                  {th.messages.map((m) => (
                    <li key={m.id}>
                      <time dateTime={m.createdAt.toISOString()}>{f.dateTime(m.createdAt)}</time>
                      <span><strong>{chat.names.get(m.senderOrgId)}</strong>: {m.body}</span>
                    </li>
                  ))}
                </ol>
              )}
              {chat.canWrite && (
                <form action={sendMessageAction} className="stack">
                  <input type="hidden" name="requestId" value={r.id} />
                  <input type="hidden" name="threadOrgId" value={th.threadOrgId} />
                  <textarea name="body" rows={2} maxLength={1000} required aria-label={t("Nachricht")} placeholder={t("Nachricht schreiben")} />
                  <div><button type="submit" className="secondary">{t("Senden")}</button></div>
                </form>
              )}
            </div>
          ))}
        </section>
      )}

      {booking && (bookingDocs.length > 0 || canDocs) && (
        <section className="card stack">
          <h2>{t("Dokumente")}</h2>
          {bookingDocs.length > 0 && (
            <ul className="plain-list">
              {bookingDocs.map((d) => (
                <li key={d.id}>
                  <a href={`/api/booking-documents/${d.id}`}>{d.title}</a>{" "}
                  <small className="muted">{orgName(d.uploadedOrgId)} · {f.dateTime(d.createdAt)}</small>
                </li>
              ))}
            </ul>
          )}
          {canDocs && bookingDocs.length < 10 && (
            <form action={uploadBookingDocumentAction} className="stack">
              <input type="hidden" name="requestId" value={r.id} />
              <input type="hidden" name="bookingId" value={booking.id} />
              <div className="fields">
                <label>{t("Bezeichnung")}<input name="title" maxLength={160} placeholder={t("z. B. Voucher, Flugticket")} /></label>
                <label>{t("Datei")}{" "}<small>{t("PDF, PNG oder JPEG, max. 5 MB")}</small><input name="file" type="file" accept=".pdf,.png,.jpg,.jpeg" required /></label>
              </div>
              <div><button type="submit" className="secondary">{t("Hochladen")}</button></div>
            </form>
          )}
        </section>
      )}

      {events.length > 0 && (
        <section className="card">
          <h2>{t("Verlauf")}</h2>
          <ol className="timeline">
            {events.map((e) => {
              const d = (e.data ?? {}) as { note?: string; amountCents?: number; feeCents?: number };
              return (
                <li key={e.id}>
                  <time dateTime={e.createdAt.toISOString()}>{f.dateTime(e.createdAt)}</time>
                  <span>
                    {t(EVENT_LABEL[e.type] ?? e.type)} · {orgName(e.actorOrgId)}
                    {typeof d.amountCents === "number" ? `, ${f.money(d.amountCents)}` : ""}
                    {typeof d.feeCents === "number" && d.feeCents > 0 ? `, ${t("Gebühr {fee}", { fee: f.money(d.feeCents) })}` : ""}
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
