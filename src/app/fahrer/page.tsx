import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Fragment } from "react";
import { AppShell } from "@/components/AppShell";
import { Empty } from "@/components/market";
import { LocationStep } from "@/components/LocationStep";
import { PushSetup } from "@/components/PushSetup";
import { ShiftTracker } from "@/components/ShiftTracker";
import { Flash, type SP } from "@/components/ui";
import { TRIP_STAGE_LABEL } from "@/lib/labels";
import { placeName } from "@/lib/places";
import { actorCan } from "@/server/authz/context";
import { getI18n } from "@/server/i18n";
import { driverOverview, type TripStep } from "@/server/services/driver";
import { referenceOf } from "@/server/services/marketplace";
import { requireOrgActor } from "@/server/web";
import { advanceTripAction, endShiftAction, reportNoShowAction, startShiftAction } from "../actions";
import { noShowAllowedFrom } from "@/lib/cancellation";

export const metadata: Metadata = { title: "Transferborsa Fahrer" };

const NEXT_STEP: Record<string, { step: TripStep; label: string }> = {
  NONE: { step: "TO_PICKUP", label: "Losfahren zur Abholung" },
  TO_PICKUP: { step: "AT_PICKUP", label: "Am Abholort angekommen" },
  AT_PICKUP: { step: "ON_BOARD", label: "Fahrgast an Bord" },
  ON_BOARD: { step: "DONE", label: "Fahrt abgeschlossen" },
};

/** Navigation im Karten-App des Handys (Google Maps öffnet auf iOS und Android die passende App). */
function navUrl(address: string | null, place: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address || place)}`;
}

export default async function DriverPage({ searchParams }: { searchParams: SP }) {
  const { t, f } = await getI18n();
  const sp = await searchParams;
  const actor = await requireOrgActor();
  if (!actorCan(actor, "trips.drive")) redirect("/dashboard");
  const { shift, consentAt, vehicles, trips, lastVehicleId, doneToday, stepTimes } = await driverOverview(actor);
  const now = new Date();
  const cur = trips[0];
  const later = trips.slice(1);

  return (
    <AppShell actor={actor} narrow path="/fahrer">
      <h1>{t("Meine Fahrten")}</h1>
      <Flash searchParams={sp} />
      {consentAt && <PushSetup banner driver />}

      <section className={shift ? "shift-bar" : "card shift"}>
        {shift ? (
          <>
            <h2>{t("Schicht läuft seit {time}", { time: f.time(shift.startedAt) })}{shift.vehicle && <span className="muted"> · {shift.vehicle.label}{shift.vehicle.licensePlate ? ` · ${shift.vehicle.licensePlate}` : ""}</span>}</h2>
            <ShiftTracker
              text={{
                sharing: t("Standort wird mit Ihrer Disposition geteilt"),
                waiting: t("Standort wird ermittelt …"),
                lastSent: t("Zuletzt gesendet {time}"),
                accuracy: t("Genauigkeit ±{m} m"),
                offline: t("Keine Verbindung, Positionen werden nachgereicht"),
                denied: t("Standortzugriff verweigert. Bitte in den Einstellungen des Browsers für diese Seite erlauben."),
                unavailable: t("Standort derzeit nicht verfügbar"),
                unsupported: t("Dieses Gerät unterstützt keine Standortbestimmung."),
                keepOpen: t("Lassen Sie diese Seite während der Schicht geöffnet."),
                background: t("Der Standort wird auch gesendet, wenn die App im Hintergrund läuft oder der Bildschirm aus ist."),
                backgroundTitle: t("Schicht läuft"),
                backgroundMessage: t("Standort wird mit Ihrer Disposition geteilt"),
              }}
            />
          </>
        ) : (
          <form action={startShiftAction} className="stack">
            <h2>{consentAt ? t("Schicht starten") : t("In 3 Schritten startklar")}</h2>
            {!consentAt && (
              <ol className="setup-steps">
                <li>
                  <strong>{t("Standort erlauben")}</strong>
                  <LocationStep
                    text={{
                      hint: t("Nur während der Schicht sieht Ihre Disposition, wo Sie sind."),
                      allow: t("Standort erlauben"),
                      on: t("Standort ist erlaubt."),
                      denied: t("Standortzugriff verweigert. Bitte in den Einstellungen des Browsers für diese Seite erlauben."),
                    }}
                  />
                </li>
                <li>
                  <strong>{t("Mitteilungen einschalten")}</strong>
                  <PushSetup driver />
                </li>
                <li><strong>{t("Schicht starten")}</strong></li>
              </ol>
            )}
            {vehicles.length > 0 && (
              <label>{t("Fahrzeug")}
                <select name="vehicleId" defaultValue={lastVehicleId ?? ""}>
                  <option value="">{t("ohne festes Fahrzeug")}</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}{v.licensePlate ? ` · ${v.licensePlate}` : ""}</option>)}
                </select>
              </label>
            )}
            {consentAt ? (
              <p className="muted">{t("Während der Schicht wird Ihr Standort an Ihr Unternehmen übertragen. Nach Schichtende nicht mehr.")}</p>
            ) : (
              <div className="consent">
                <label className="check"><input type="checkbox" name="consent" required /> {t("Ich bin einverstanden, dass mein Standort während der Schicht übertragen wird.")}</label>
                <details>
                  <summary>{t("Was wird übertragen?")}</summary>
                  <p>{t("Während einer Schicht überträgt Transferborsa etwa alle 15 Sekunden Ihren Standort an die Disposition Ihres Unternehmens, damit Fahrten koordiniert werden können. Während einer Fahrt sehen auch Auftraggeber und Fahrgast, wo das Fahrzeug ist. Außerhalb der Schicht wird nichts übertragen. Der Verlauf wird nach 30 Tagen gelöscht.")}</p>
                </details>
              </div>
            )}
            <div><button type="submit" className="big accent">{t("Schicht starten")}</button></div>
          </form>
        )}
      </section>

      {cur ? <CurrentTrip b={cur} stepTimes={stepTimes} /> : (
        <section className="card free">
          <h2 className="free-title">{t("Gerade frei")}</h2>
          <p className="flush">{t("Ihnen sind gerade keine Fahrten zugewiesen. Sobald die Disposition Ihnen eine Fahrt gibt, erscheint sie hier.")}</p>
        </section>
      )}

      {later.length > 0 && (
        <section className="card later">
          <h2>{t("Später")}</h2>
          {later.map((b) => {
            const r = b.request;
            const from = t(placeName(r.pickupPlaceId));
            const to = t(placeName(r.dropoffPlaceId));
            const next = NEXT_STEP[b.tripStage ?? "NONE"];
            return (
              <details key={b.id} className="later-trip">
                <summary>
                  <strong className="later-time">{sameDay(r.pickupAt, now) ? f.time(r.pickupAt) : `${f.date(r.pickupAt)} ${f.time(r.pickupAt)}`}</strong>
                  <span>{from} <span className="muted">→</span> {to}<span className="price-note">{t("{p} Pers. · {l} Gep.", { p: r.passengers, l: r.luggage })}{r.flightNumber ? ` · ${t("Flug")} ${r.flightNumber}` : ""}</span></span>
                </summary>
                <TripFacts b={b} />
                <form action={advanceTripAction} className="trip-action">
                  <input type="hidden" name="bookingId" value={b.id} />
                  <input type="hidden" name="step" value={next.step} />
                  <button type="submit" className="big secondary">{t(next.label)}</button>
                </form>
              </details>
            );
          })}
        </section>
      )}

      {doneToday.length > 0 && (
        <section className="card">
          <h2>{t("Erledigt heute")}</h2>
          <ul className="steps">
            {doneToday.map((d) => (
              <li key={d.id}>
                <span>{f.time(d.request.pickupAt)} · {t(placeName(d.request.pickupPlaceId))} <span className="muted">→</span> {t(placeName(d.request.dropoffPlaceId))}</span>
                <span className="badge ok">{t("erledigt")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {shift && (
        <form action={endShiftAction} className="shift-end">
          <button type="submit" className="big secondary">{t("Schicht beenden")}</button>
        </form>
      )}
    </AppShell>
  );
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

type Trip = Awaited<ReturnType<typeof driverOverview>>["trips"][number];

/** Fakten zu einer Fahrt, die der Fahrer unterwegs braucht. */
async function TripFacts({ b }: { b: Trip }) {
  const { t } = await getI18n();
  const r = b.request;
  const from = t(placeName(r.pickupPlaceId));
  const to = t(placeName(r.dropoffPlaceId));
  return (
    <dl className="kv trip-facts">
      <dt>{t("Abholung")}</dt>
      <dd><a href={navUrl(r.pickupAddress, from)} target="_blank" rel="noreferrer">{r.pickupAddress || from}</a></dd>
      <dt>{t("Ziel")}</dt>
      <dd><a href={navUrl(r.dropoffAddress, to)} target="_blank" rel="noreferrer">{r.dropoffAddress || to}</a></dd>
      <dt>{t("Fahrgäste")}</dt>
      <dd>{t("{p} Pers. · {l} Gep.", { p: r.passengers, l: r.luggage })}{r.skiEquipment ? ` · ${t("{n} Ski", { n: r.skiEquipment })}` : ""}{r.childSeats ? ` · ${t("{n} Kindersitze", { n: r.childSeats })}` : ""}</dd>
      {r.flightNumber && <><dt>{t("Flug")}</dt><dd>{r.flightNumber}</dd></>}
      {r.pickupNotes && <><dt>{t("Hinweise")}</dt><dd>{r.pickupNotes}</dd></>}
      {r.requirements && <><dt>{t("Anforderungen")}</dt><dd>{r.requirements}</dd></>}
      {b.vehicle && <><dt>{t("Fahrzeug")}</dt><dd>{b.vehicle.label}</dd></>}
      <dt>{t("Auftrag")}</dt><dd>{referenceOf(r.number)} · {b.requesterOrg.name}{b.requesterOrg.phone && <> · <a href={`tel:${b.requesterOrg.phone}`}>{b.requesterOrg.phone}</a></>}</dd>
    </dl>
  );
}

/**
 * Die aktuelle Fahrt, je Schritt auf das Nötige reduziert: vor der Abfahrt Zeit und Strecke, unterwegs
 * die Abholadresse mit Navigation und Fahrgast, mit Fahrgast an Bord das Ziel. Ein großer Knopf je Schritt.
 */
async function CurrentTrip({ b, stepTimes }: { b: Trip; stepTimes: Partial<Record<string, Date>> }) {
  const { t, f } = await getI18n();
  const r = b.request;
  const stage = b.tripStage ?? "NONE";
  const next = NEXT_STEP[stage];
  const from = t(placeName(r.pickupPlaceId));
  const to = t(placeName(r.dropoffPlaceId));
  const now = new Date();
  const minutes = Math.round((r.pickupAt.getTime() - now.getTime()) / 60_000);
  const onBoard = stage === "ON_BOARD";
  const target = onBoard ? { address: r.dropoffAddress, place: to } : { address: r.pickupAddress, place: from };
  const steps: { key: string; label: string; at?: Date; done: boolean; current: boolean }[] = [
    { key: "booking.started", label: t("Losgefahren"), done: stage !== "NONE", current: stage === "TO_PICKUP" },
    { key: "booking.at_pickup", label: t("Am Abholort"), done: stage === "AT_PICKUP" || onBoard, current: stage === "AT_PICKUP" },
    { key: "booking.on_board", label: t("Fahrgast an Bord"), done: onBoard, current: onBoard },
    { key: "done", label: t("Abgeschlossen"), done: false, current: false },
  ];

  return (
    <article className="card now" aria-label={t("Aktuelle Fahrt")}>
      {stage === "NONE" ? (
        <>
          <p className="now-label">{t("Nächste Fahrt")}</p>
          <div className="now-time">
            <span className="trip-time">{f.time(r.pickupAt)}</span>
            <span className="badge neutral">{sameDay(r.pickupAt, now) ? (minutes > 0 ? t("in {d}", { d: f.minutes(minutes) }) : t("jetzt")) : f.date(r.pickupAt)}</span>
          </div>
          <p className="trip-route">{from} <span className="muted">→</span> {to}</p>
          <p className="muted flush">
            {[r.pickupAddress || from, t("{p} Pers. · {l} Gep.", { p: r.passengers, l: r.luggage }), r.skiEquipment ? t("{n} Ski", { n: r.skiEquipment }) : null, r.flightNumber ? `${t("Flug")} ${r.flightNumber}` : null, b.vehicle?.label].filter(Boolean).join(" · ")}
          </p>
        </>
      ) : (
        <>
          <p className="now-label">{onBoard ? t("Ziel") : t("Abholung {time}", { time: f.time(r.pickupAt) })}{target.address ? ` · ${target.place}` : ""}</p>
          <p className="now-address">{target.address || target.place}</p>
          <a href={navUrl(target.address, target.place)} target="_blank" rel="noreferrer" className="btn big dark">{t("Navigation öffnen")}</a>
          {!onBoard && r.passengersContact.map((p) => (
            <div key={p.id} className="now-person">
              <span><strong>{p.name}</strong><span className="price-note">{t("{p} Pers. · {l} Gep.", { p: r.passengers, l: r.luggage })}{r.skiEquipment ? ` · ${t("{n} Ski", { n: r.skiEquipment })}` : ""}</span></span>
              {p.phone && <a href={`tel:${p.phone}`} className="btn secondary">{t("Anrufen")}</a>}
            </div>
          ))}
          {!onBoard && (
            <dl className="kv trip-facts">
              {r.pickupNotes && <><dt>{t("Hinweise")}</dt><dd>{r.pickupNotes}</dd></>}
              {r.flightNumber && <><dt>{t("Flug")}</dt><dd>{r.flightNumber}</dd></>}
              <dt>{t("Ziel")}</dt><dd>{r.dropoffAddress || to}</dd>
              <dt>{t("Auftrag")}</dt><dd>{referenceOf(r.number)} · {b.requesterOrg.name}{b.requesterOrg.phone && <> · <a href={`tel:${b.requesterOrg.phone}`}>{b.requesterOrg.phone}</a></>}</dd>
            </dl>
          )}
          <ol className="trip-steps">
            {steps.map((s) => (
              <li key={s.key} className={s.current ? "current" : s.done ? "done" : undefined}>
                <span className="dot" aria-hidden="true" />
                <span>{s.label}</span>
                <span className="muted">{stepTimes[s.key] ? f.time(stepTimes[s.key]!) : ""}</span>
              </li>
            ))}
          </ol>
          {onBoard && <p className="price-note">{t("Der Auftraggeber sieht jeden Schritt mit Uhrzeit.")}</p>}
        </>
      )}
      <form action={advanceTripAction} className="trip-action">
        <input type="hidden" name="bookingId" value={b.id} />
        <input type="hidden" name="step" value={next.step} />
        <button type="submit" className="big accent">{t(next.label)}</button>
      </form>
      {stage === "AT_PICKUP" && (
        now >= noShowAllowedFrom(r.pickupAt, r.flightNumber) ? (
          <form action={reportNoShowAction} className="trip-action">
            <input type="hidden" name="bookingId" value={b.id} />
            <button type="submit" className="big danger">{t("Fahrgast nicht erschienen")}</button>
          </form>
        ) : (
          <p className="muted flush trip-note">{t("Erscheint der Fahrgast nicht, können Sie das ab {time} melden.", { time: f.time(noShowAllowedFrom(r.pickupAt, r.flightNumber)) })}</p>
        )
      )}
    </article>
  );
}
