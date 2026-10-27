import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { LiveMap } from "@/components/LiveMap";
import { Empty, Route } from "@/components/market";
import { Badge, Flash, type SP } from "@/components/ui";
import { BOOKING_STATUS_LABEL, ROLE_LABEL, TRIP_STAGE_LABEL } from "@/lib/labels";
import { actorCan } from "@/server/authz/context";
import { getI18n } from "@/server/i18n";
import { listDispatchBookings, listDrivers, liveFleet } from "@/server/services/dispatch";
import { listVehicles } from "@/server/services/fleet";
import { referenceOf } from "@/server/services/marketplace";
import { requireOrgActor } from "@/server/web";
import { assignBookingAction } from "../../actions";

export default async function LiveFleetPage({ searchParams }: { searchParams: SP }) {
  const { t, f, locale } = await getI18n();
  const sp = await searchParams;
  const actor = await requireOrgActor();
  if (!actorCan(actor, "fleet.manage")) redirect("/dashboard");
  const [live, bookings, drivers, vehicles] = await Promise.all([
    liveFleet(actor),
    listDispatchBookings(actor),
    listDrivers(actor),
    listVehicles(actor),
  ]);
  for (const v of live.vehicles) {
    if (v.trip) {
      v.trip.pickup.name = t(v.trip.pickup.name);
      v.trip.dropoff.name = t(v.trip.dropoff.name);
    }
  }
  const activeVehicles = vehicles.filter((v) => v.active);
  const onlyOwner = drivers.every((d) => d.role !== "DRIVER");

  return (
    <AppShell actor={actor} path="/flotte/live">
      <div className="head-row">
        <div>
          <h1>{t("Live-Karte")}</h1>
          <p className="sub">{t("Wo Ihre Fahrzeuge gerade sind, wohin sie fahren und wer welchen Auftrag hat. Sichtbar sind Fahrer mit laufender Schicht.")}</p>
        </div>
        {live.unassigned > 0 && (
          <a href="#disposition" className="alert-link">{t("{n} Fahrt(en) in den nächsten 24 h ohne Fahrer", { n: live.unassigned })}</a>
        )}
      </div>
      <Flash searchParams={sp} />

      <LiveMap
        initial={live}
        locale={locale}
        text={{
          free: t("Frei"),
          toPickup: t("Auf dem Weg zur Abholung"),
          atPickup: t("Am Abholort"),
          onBoard: t("Fahrgast an Bord"),
          nextTrip: t("Nächster Auftrag geplant"),
          stale: t("Kein Signal"),
          noPosition: t("Noch keine Position empfangen"),
          ago: t("vor {n}"),
          pickupAt: t("Abholung {time}"),
          persons: t("{n} Pers."),
          pickup: t("Abholung"),
          dropoff: t("Ziel"),
          noDrivers: t("Gerade ist kein Fahrer in der Schicht. Fahrer starten ihre Schicht auf dem Handy unter „Meine Fahrten“."),
          open: t("Fahrer in der Schicht"),
          updated: t("Aktualisiert {time}"),
          offline: t("Verbindung unterbrochen, versuche erneut …"),
        }}
      />
      <p className="map-legend">
        <span><i className="dot s-free" /> {t("Frei")}</span>
        <span><i className="dot s-next" /> {t("Nächster Auftrag geplant")}</span>
        <span><i className="dot s-to-pickup" /> {t("Auf dem Weg zur Abholung")}</span>
        <span><i className="dot s-on-board" /> {t("Fahrgast an Bord")}</span>
        <span><i className="dot s-stale" /> {t("Kein Signal")}</span>
      </p>

      <section className="card" id="disposition">
        <h2>{t("Disposition")}</h2>
        <p className="muted">{t("Weisen Sie jeder Fahrt einen Fahrer und ein Fahrzeug zu. Der Fahrer sieht die Fahrt dann sofort auf seinem Handy.")}</p>
        {onlyOwner && (
          <p className="flash ok">{t("Noch keine Fahrer angelegt. Laden Sie Ihre Fahrer unter Team mit der Rolle „Fahrer“ ein.")}{" "}<Link href="/organization/members">{t("Zum Team")}</Link></p>
        )}
        {bookings.length === 0 ? <Empty>{t("Keine anstehenden Fahrten.")}</Empty> : (
          <div className="table-wrap">
            <table className="responsive">
              <thead><tr><th>{t("Abholung")}</th><th>{t("Strecke")}</th><th>{t("Status")}</th><th>{t("Fahrer und Fahrzeug")}</th></tr></thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className={b.driverId ? undefined : "match-warn"}>
                    <td className="nowrap">{f.dateTime(b.request.pickupAt)}<span className="price-note">{referenceOf(b.request.number)} · {t("{n} Pers.", { n: b.request.passengers })}</span></td>
                    <td><Route from={b.request.pickupPlaceId} to={b.request.dropoffPlaceId} href={`/boerse/auftrag/${b.request.id}`} /></td>
                    <td>
                      <Badge status={b.status}>{t(BOOKING_STATUS_LABEL[b.status])}</Badge>
                      {b.tripStage && <span className="price-note">{t(TRIP_STAGE_LABEL[b.tripStage])}</span>}
                    </td>
                    <td>
                      <form action={assignBookingAction} className="inline assign">
                        <input type="hidden" name="bookingId" value={b.id} />
                        <select name="driverId" defaultValue={b.driverId ?? ""} aria-label={t("Fahrer")}>
                          <option value="">{t("– kein Fahrer –")}</option>
                          {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}{d.role !== "DRIVER" ? ` (${t(ROLE_LABEL[d.role])})` : ""}</option>)}
                        </select>
                        <select name="vehicleId" defaultValue={b.vehicleId ?? ""} aria-label={t("Fahrzeug")}>
                          <option value="">{t("– kein Fahrzeug –")}</option>
                          {activeVehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                        </select>
                        <button type="submit" className="secondary">{t("Zuweisen")}</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
