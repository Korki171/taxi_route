import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Empty, PlaceSelect, Route, VehicleSelect } from "@/components/market";
import { Badge, Flash, type SP } from "@/components/ui";
import { fmtDateTime, fmtTime } from "@/lib/format";
import { CAPACITY_STATUS_LABEL, VEHICLE_LABEL } from "@/lib/labels";
import { actorCan } from "@/server/authz/context";
import { listOwnCapacity, listVehicles } from "@/server/services/fleet";
import { requireOrgActor } from "@/server/web";
import { createVehicleAction, publishCapacityAction, setVehicleActiveAction } from "../actions";
import { getI18n } from "@/server/i18n";

export default async function FleetPage({ searchParams }: { searchParams: SP }) {
  const { t, f } = await getI18n();
  const sp = await searchParams;
  const actor = await requireOrgActor();
  const canFleet = actorCan(actor, "fleet.manage");
  const canPublish = actorCan(actor, "capacity.publish");
  if (!canFleet && !canPublish) redirect("/dashboard");
  const [vehicles, offers] = await Promise.all([
    canFleet ? listVehicles(actor) : Promise.resolve([]),
    canPublish ? listOwnCapacity(actor) : Promise.resolve([]),
  ]);
  const active = vehicles.filter((v) => v.active);

  return (
    <AppShell actor={actor}>
      <h1>{t("Flotte und freie Fahrten")}</h1>
      <p className="sub">{t("Fahrzeuge verwalten und Leerfahrten oder geplante Rückfahrten anbieten. Kennzeichen sind für andere Unternehmen nicht sichtbar.")}</p>
      <Flash searchParams={sp} />

      {canPublish && (
        <section className="card" id="fahrt">
          <h2>{t("Rückfahrt oder freie Kapazität anbieten")}</h2>
          <p className="muted">{t("Neue Fahrten sind zunächst „geplant, unverbindlich“. Erst wenn Sie sie bestätigen, gelten sie als verbindliche Kapazität. Passende Aufträge finden Sie danach unter")}{" "}<Link href="/boerse?view=rueckfahrten">{t("Passende Rückfahrten")}</Link>.</p>
          <form action={publishCapacityAction} className="stack">
            <div className="fields">
              <label>{t("Von")}<PlaceSelect name="fromPlaceId" required /></label>
              <label>{t("Nach")}<PlaceSelect name="toPlaceId" required /></label>
              <label>{t("Verfügbar ab")}<input type="datetime-local" name="availableFrom" required /></label>
              <label>{t("Verfügbar bis")}<input type="datetime-local" name="availableUntil" required /></label>
              <label>{t("Max. Umweg (min)")}<input type="number" name="maxDetourMinutes" min={0} max={240} defaultValue={20} /></label>
              <label>{t("Max. Wartezeit (min)")}<input type="number" name="maxWaitMinutes" min={0} max={480} defaultValue={60} /></label>
            </div>
            {active.length > 0 ? (
              <label>{t("Fahrzeug")}
                <select name="vehicleId" required defaultValue="">
                  <option value="">{t("Bitte wählen")}</option>
                  {active.map((v) => <option key={v.id} value={v.id}>{v.label} · {t(VEHICLE_LABEL[v.category])} · {t("{s} Plätze, {l} Gepäck", { s: v.seats, l: v.luggage })}</option>)}
                </select>
              </label>
            ) : (
              <div className="fields">
                <label>{t("Fahrzeugkategorie")}<VehicleSelect name="vehicleCategory" required /></label>
                <label>{t("Freie Plätze")}<input type="number" name="seats" min={1} max={60} required /></label>
                <label>{t("Gepäckstücke")}<input type="number" name="luggage" min={0} max={80} required /></label>
              </div>
            )}
            <label>{t("Notiz")}<input name="note" maxLength={500} placeholder={t("z. B. Rückfahrt nach Gästeabgabe am Terminal 1")} /></label>
            <div><button type="submit">{t("Fahrt veröffentlichen")}</button></div>
          </form>
        </section>
      )}

      {canPublish && (
        <section className="card">
          <h2>{t("Ihre veröffentlichten Fahrten")}</h2>
          {offers.length === 0 ? <Empty>{t("Keine aktuellen Fahrten.")}</Empty> : (
            <div className="table-wrap">
              <table className="responsive">
                <thead><tr><th>{t("Zeitfenster")}</th><th>{t("Strecke")}</th><th>{t("Fahrzeug")}</th><th>{t("Plätze")}</th><th>{t("Status")}</th></tr></thead>
                <tbody>
                  {offers.map((o) => (
                    <tr key={o.id}>
                      <td className="nowrap">{f.dateTime(o.availableFrom)} – {f.time(o.availableUntil)}</td>
                      <td><Route from={o.fromPlaceId} to={o.toPlaceId} href="/boerse?view=rueckfahrten" /></td>
                      <td data-label={t("Fahrzeug")}>{o.vehicle?.label ?? t(VEHICLE_LABEL[o.vehicleCategory])}</td>
                      <td data-label={t("Plätze")}>{t("{p} Pers. · {l} Gep.", { p: o.seats, l: o.luggage })}</td>
                      <td><Badge status={o.status}>{t(CAPACITY_STATUS_LABEL[o.status])}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {canFleet && (
        <section className="card">
          <h2>{t("Fahrzeuge")}</h2>
          {vehicles.length === 0 ? <Empty>{t("Noch keine Fahrzeuge angelegt.")}</Empty> : (
            <div className="table-wrap">
              <table className="responsive">
                <thead><tr><th>{t("Bezeichnung")}</th><th>{t("Kategorie")}</th><th>{t("Kennzeichen")}</th><th>{t("Plätze")}</th><th>{t("Gepäck / Ski")}</th><th>{t("Status")}</th><th></th></tr></thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr key={v.id}>
                      <td>{v.label}</td>
                      <td data-label={t("Kategorie")}>{t(VEHICLE_LABEL[v.category])}</td>
                      <td data-label={t("Kennzeichen")}>{v.licensePlate ?? <span className="muted">–</span>}</td>
                      <td data-label={t("Plätze")}>{v.seats}</td>
                      <td data-label={t("Gepäck")}>{v.luggage} / {v.skiCapacity}</td>
                      <td><Badge status={v.active ? "ACTIVE" : "INACTIVE"}>{v.active ? t("Im Einsatz") : t("Stillgelegt")}</Badge></td>
                      <td>
                        <form action={setVehicleActiveAction}>
                          <input type="hidden" name="vehicleId" value={v.id} />
                          <input type="hidden" name="active" value={v.active ? "0" : "1"} />
                          <button type="submit" className="link">{v.active ? t("Stilllegen") : t("Wieder aktivieren")}</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <h3>{t("Fahrzeug anlegen")}</h3>
          <form action={createVehicleAction} className="stack">
            <div className="fields">
              <label>{t("Bezeichnung")}<input name="label" required maxLength={80} placeholder={t("Mercedes V-Klasse 1")} /></label>
              <label>{t("Kategorie")}<VehicleSelect name="category" required /></label>
              <label>{t("Kennzeichen")}{" "}<small>{t("nur intern")}</small><input name="licensePlate" maxLength={20} /></label>
              <label>{t("Sitzplätze (Fahrgäste)")}<input type="number" name="seats" min={1} max={60} required /></label>
              <label>{t("Gepäckstücke")}<input type="number" name="luggage" min={0} max={80} required /></label>
              <label>{t("Skiausrüstung")}<input type="number" name="skiCapacity" min={0} max={60} defaultValue={0} /></label>
            </div>
            <div><button type="submit">{t("Fahrzeug anlegen")}</button></div>
          </form>
        </section>
      )}
    </AppShell>
  );
}
