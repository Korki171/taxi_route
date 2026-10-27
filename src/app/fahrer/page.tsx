import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Fragment } from "react";
import { AppShell } from "@/components/AppShell";
import { Empty } from "@/components/market";
import { ShiftTracker } from "@/components/ShiftTracker";
import { Flash, type SP } from "@/components/ui";
import { TRIP_STAGE_LABEL } from "@/lib/labels";
import { placeName } from "@/lib/places";
import { actorCan } from "@/server/authz/context";
import { getI18n } from "@/server/i18n";
import { driverOverview, type TripStep } from "@/server/services/driver";
import { referenceOf } from "@/server/services/marketplace";
import { requireOrgActor } from "@/server/web";
import { advanceTripAction, endShiftAction, startShiftAction } from "../actions";

export const metadata: Metadata = { title: "TaxiRoute Fahrer" };

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
  const { shift, consentAt, vehicles, trips } = await driverOverview(actor);

  return (
    <AppShell actor={actor} narrow path="/fahrer">
      <h1>{t("Meine Fahrten")}</h1>
      <p className="sub">{t("Ihre zugewiesenen Fahrten. Während der Schicht sieht Ihre Disposition, wo Sie gerade sind.")}</p>
      <Flash searchParams={sp} />

      <section className="card shift">
        {shift ? (
          <>
            <div className="head-row">
              <h2>{t("Schicht läuft seit {time}", { time: f.time(shift.startedAt) })}</h2>
              <form action={endShiftAction}>
                <button type="submit" className="secondary">{t("Schicht beenden")}</button>
              </form>
            </div>
            {shift.vehicle && <p className="muted">{t("Fahrzeug")}: {shift.vehicle.label}{shift.vehicle.licensePlate ? ` · ${shift.vehicle.licensePlate}` : ""}</p>}
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
              }}
            />
          </>
        ) : (
          <form action={startShiftAction} className="stack">
            <h2>{t("Schicht starten")}</h2>
            {vehicles.length > 0 && (
              <label>{t("Fahrzeug")}
                <select name="vehicleId" defaultValue="">
                  <option value="">{t("ohne festes Fahrzeug")}</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}{v.licensePlate ? ` · ${v.licensePlate}` : ""}</option>)}
                </select>
              </label>
            )}
            {consentAt ? (
              <p className="muted">{t("Während der Schicht wird Ihr Standort an Ihr Unternehmen übertragen. Nach Schichtende nicht mehr.")}</p>
            ) : (
              <div className="consent">
                <p>{t("Während einer Schicht überträgt TaxiRoute etwa alle 15 Sekunden Ihren Standort an die Disposition Ihres Unternehmens, damit Fahrten koordiniert werden können. Außerhalb der Schicht wird nichts übertragen. Der Verlauf wird nach 30 Tagen gelöscht.")}</p>
                <label className="check"><input type="checkbox" name="consent" required /> {t("Ich bin einverstanden, dass mein Standort während der Schicht übertragen wird.")}</label>
              </div>
            )}
            <div><button type="submit" className="big accent">{t("Schicht starten")}</button></div>
          </form>
        )}
      </section>

      <h2 className="section-title">{t("Zugewiesene Fahrten")}</h2>
      {trips.length === 0 ? <Empty>{t("Ihnen sind gerade keine Fahrten zugewiesen.")}</Empty> : trips.map((b, i) => {
        const r = b.request;
        const next = NEXT_STEP[b.tripStage ?? "NONE"];
        const from = t(placeName(r.pickupPlaceId));
        const to = t(placeName(r.dropoffPlaceId));
        return (
          <article key={b.id} className={`card trip${i === 0 ? " current" : ""}`}>
            <div className="trip-head">
              <div>
                <span className="trip-date">{f.date(r.pickupAt)}</span>
                <span className="trip-time">{f.time(r.pickupAt)}</span>
                <p className="trip-route">{from} <span className="muted">→</span> {to}</p>
              </div>
              <span className="badge warn">{b.tripStage ? t(TRIP_STAGE_LABEL[b.tripStage]) : t("Geplant")}</span>
            </div>
            <dl className="kv">
              <dt>{t("Abholung")}</dt>
              <dd><a href={navUrl(r.pickupAddress, from)} target="_blank" rel="noreferrer">{r.pickupAddress || from}</a></dd>
              <dt>{t("Ziel")}</dt>
              <dd><a href={navUrl(r.dropoffAddress, to)} target="_blank" rel="noreferrer">{r.dropoffAddress || to}</a></dd>
              <dt>{t("Fahrgäste")}</dt>
              <dd>{t("{p} Pers. · {l} Gep.", { p: r.passengers, l: r.luggage })}{r.skiEquipment ? ` · ${t("{n} Ski", { n: r.skiEquipment })}` : ""}{r.childSeats ? ` · ${t("{n} Kindersitze", { n: r.childSeats })}` : ""}</dd>
              {r.passengersContact.map((p) => (
                <Fragment key={p.id}><dt>{t("Fahrgast")}</dt><dd>{p.name}{p.phone && <> · <a href={`tel:${p.phone}`}>{p.phone}</a></>}</dd></Fragment>
              ))}
              {r.flightNumber && <><dt>{t("Flug")}</dt><dd>{r.flightNumber}</dd></>}
              {r.pickupNotes && <><dt>{t("Hinweise")}</dt><dd>{r.pickupNotes}</dd></>}
              {r.requirements && <><dt>{t("Anforderungen")}</dt><dd>{r.requirements}</dd></>}
              {b.vehicle && <><dt>{t("Fahrzeug")}</dt><dd>{b.vehicle.label}</dd></>}
              <dt>{t("Auftrag")}</dt><dd>{referenceOf(r.number)} · {b.requesterOrg.name}{b.requesterOrg.phone && <> · <a href={`tel:${b.requesterOrg.phone}`}>{b.requesterOrg.phone}</a></>}</dd>
            </dl>
            <form action={advanceTripAction} className="trip-action">
              <input type="hidden" name="bookingId" value={b.id} />
              <input type="hidden" name="step" value={next.step} />
              <button type="submit" className={i === 0 ? "big accent" : "big"}>{t(next.label)}</button>
            </form>
          </article>
        );
      })}
    </AppShell>
  );
}
