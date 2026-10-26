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

export default async function FleetPage({ searchParams }: { searchParams: SP }) {
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
      <h1>Flotte und freie Fahrten</h1>
      <p className="sub">Fahrzeuge verwalten und Leerfahrten oder geplante Rückfahrten anbieten. Kennzeichen sind für andere Unternehmen nicht sichtbar.</p>
      <Flash searchParams={sp} />

      {canPublish && (
        <section className="card" id="fahrt">
          <h2>Rückfahrt oder freie Kapazität anbieten</h2>
          <p className="muted">Neue Fahrten sind zunächst „geplant, unverbindlich“. Erst wenn Sie sie bestätigen, gelten sie als verbindliche Kapazität. Passende Aufträge finden Sie danach unter <Link href="/boerse?view=rueckfahrten">Passende Rückfahrten</Link>.</p>
          <form action={publishCapacityAction} className="stack">
            <div className="fields">
              <label>Von<PlaceSelect name="fromPlaceId" required /></label>
              <label>Nach<PlaceSelect name="toPlaceId" required /></label>
              <label>Verfügbar ab<input type="datetime-local" name="availableFrom" required /></label>
              <label>Verfügbar bis<input type="datetime-local" name="availableUntil" required /></label>
              <label>Max. Umweg (min)<input type="number" name="maxDetourMinutes" min={0} max={240} defaultValue={20} /></label>
              <label>Max. Wartezeit (min)<input type="number" name="maxWaitMinutes" min={0} max={480} defaultValue={60} /></label>
            </div>
            {active.length > 0 ? (
              <label>Fahrzeug
                <select name="vehicleId" required defaultValue="">
                  <option value="">Bitte wählen</option>
                  {active.map((v) => <option key={v.id} value={v.id}>{v.label} · {VEHICLE_LABEL[v.category]} · {v.seats} Plätze, {v.luggage} Gepäck</option>)}
                </select>
              </label>
            ) : (
              <div className="fields">
                <label>Fahrzeugkategorie<VehicleSelect name="vehicleCategory" required /></label>
                <label>Freie Plätze<input type="number" name="seats" min={1} max={60} required /></label>
                <label>Gepäckstücke<input type="number" name="luggage" min={0} max={80} required /></label>
              </div>
            )}
            <label>Notiz<input name="note" maxLength={500} placeholder="z. B. Rückfahrt nach Gästeabgabe am Terminal 1" /></label>
            <div><button type="submit">Fahrt veröffentlichen</button></div>
          </form>
        </section>
      )}

      {canPublish && (
        <section className="card">
          <h2>Ihre veröffentlichten Fahrten</h2>
          {offers.length === 0 ? <Empty>Keine aktuellen Fahrten.</Empty> : (
            <div className="table-wrap">
              <table className="responsive">
                <thead><tr><th>Zeitfenster</th><th>Strecke</th><th>Fahrzeug</th><th>Plätze</th><th>Status</th></tr></thead>
                <tbody>
                  {offers.map((o) => (
                    <tr key={o.id}>
                      <td className="nowrap">{fmtDateTime(o.availableFrom)} – {fmtTime(o.availableUntil)}</td>
                      <td><Route from={o.fromPlaceId} to={o.toPlaceId} href="/boerse?view=rueckfahrten" /></td>
                      <td data-label="Fahrzeug">{o.vehicle?.label ?? VEHICLE_LABEL[o.vehicleCategory]}</td>
                      <td data-label="Plätze">{o.seats} Pers. · {o.luggage} Gep.</td>
                      <td><Badge status={o.status}>{CAPACITY_STATUS_LABEL[o.status]}</Badge></td>
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
          <h2>Fahrzeuge</h2>
          {vehicles.length === 0 ? <Empty>Noch keine Fahrzeuge angelegt.</Empty> : (
            <div className="table-wrap">
              <table className="responsive">
                <thead><tr><th>Bezeichnung</th><th>Kategorie</th><th>Kennzeichen</th><th>Plätze</th><th>Gepäck / Ski</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr key={v.id}>
                      <td>{v.label}</td>
                      <td data-label="Kategorie">{VEHICLE_LABEL[v.category]}</td>
                      <td data-label="Kennzeichen">{v.licensePlate ?? <span className="muted">–</span>}</td>
                      <td data-label="Plätze">{v.seats}</td>
                      <td data-label="Gepäck">{v.luggage} / {v.skiCapacity}</td>
                      <td><Badge status={v.active ? "ACTIVE" : "INACTIVE"}>{v.active ? "Im Einsatz" : "Stillgelegt"}</Badge></td>
                      <td>
                        <form action={setVehicleActiveAction}>
                          <input type="hidden" name="vehicleId" value={v.id} />
                          <input type="hidden" name="active" value={v.active ? "0" : "1"} />
                          <button type="submit" className="link">{v.active ? "Stilllegen" : "Wieder aktivieren"}</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <h3>Fahrzeug anlegen</h3>
          <form action={createVehicleAction} className="stack">
            <div className="fields">
              <label>Bezeichnung<input name="label" required maxLength={80} placeholder="Mercedes V-Klasse 1" /></label>
              <label>Kategorie<VehicleSelect name="category" required /></label>
              <label>Kennzeichen <small>nur intern</small><input name="licensePlate" maxLength={20} /></label>
              <label>Sitzplätze (Fahrgäste)<input type="number" name="seats" min={1} max={60} required /></label>
              <label>Gepäckstücke<input type="number" name="luggage" min={0} max={80} required /></label>
              <label>Skiausrüstung<input type="number" name="skiCapacity" min={0} max={60} defaultValue={0} /></label>
            </div>
            <div><button type="submit">Fahrzeug anlegen</button></div>
          </form>
        </section>
      )}
    </AppShell>
  );
}
