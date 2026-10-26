import { AppShell } from "@/components/AppShell";
import { OrgProfileFields } from "@/components/OrgProfileFields";
import { Badge, Flash, type SP } from "@/components/ui";
import { CAPABILITY_LABEL, VEHICLE_LABEL, VERIFICATION_LABEL } from "@/lib/labels";
import { actorCan } from "@/server/authz/context";
import { getOwnOrganization } from "@/server/services/organizations";
import { requireOrgActor } from "@/server/web";
import type { Capability, VehicleCategory } from "@prisma/client";
import { requestCapabilityAction, updateProfileAction, updateTransportProfileAction } from "../actions";

const ALL_CAPS: Capability[] = ["TRANSFER_BOOKER", "TRANSPORT_PROVIDER"];

export default async function OrganizationPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const actor = await requireOrgActor();
  const org = await getOwnOrganization(actor);
  const canEdit = actorCan(actor, "org.update");
  const canRequest = actorCan(actor, "capabilities.request");
  const capByType = new Map(org.capabilities.map((c) => [c.capability, c]));
  const tp = org.transportProfile;

  return (
    <AppShell actor={actor}>
      <h1>Unternehmen</h1>
      <p className="sub">Stammdaten, Beförderungsdaten und Verifizierung</p>
      <Flash searchParams={sp} />

      <section className="card">
        <h2>Geschäftsfunktionen und Prüfstatus</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Funktion</th><th>Status</th><th>Hinweis</th><th></th></tr></thead>
            <tbody>
              {ALL_CAPS.map((cap) => {
                const c = capByType.get(cap);
                const status = c?.status;
                const requestable = canRequest && (!status || status === "UNVERIFIED" || status === "REJECTED");
                return (
                  <tr key={cap}>
                    <td>{CAPABILITY_LABEL[cap]}</td>
                    <td>{status ? <Badge status={status}>{VERIFICATION_LABEL[status]}</Badge> : <span className="muted">Nicht beantragt</span>}</td>
                    <td className="muted">{c?.reviewNote ?? (cap === "TRANSPORT_PROVIDER" ? "Erfordert Konzession und Versicherungsnachweis." : "")}</td>
                    <td>
                      {requestable && (
                        <form action={requestCapabilityAction}>
                          <input type="hidden" name="capability" value={cap} />
                          <button type="submit" className="secondary">Prüfung beantragen</button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Unternehmensdaten</h2>
        <form action={updateProfileAction} className="stack">
          <OrgProfileFields org={org} disabled={!canEdit} />
          {canEdit && <div><button type="submit">Speichern</button></div>}
        </form>
      </section>

      {capByType.has("TRANSPORT_PROVIDER") && (
        <section className="card">
          <h2>Beförderungsbetrieb</h2>
          <form action={updateTransportProfileAction} className="stack">
            <fieldset disabled={!canEdit} style={{ border: 0, padding: 0, margin: 0 }} className="stack">
              <div className="fields">
                <label>Konzessionsnummer<input name="concessionNumber" defaultValue={tp?.concessionNumber ?? ""} /></label>
                <label>Anzahl Fahrzeuge<input name="fleetSize" type="number" min={0} defaultValue={tp?.fleetSize ?? ""} /></label>
              </div>
              <fieldset>
                <legend>Verfügbare Fahrzeugkategorien</legend>
                <div className="checks">
                  {(Object.keys(VEHICLE_LABEL) as VehicleCategory[]).map((v) => (
                    <label key={v}>
                      <input type="checkbox" name="vehicleCategories" value={v} defaultChecked={tp?.vehicleCategories.includes(v)} />
                      {VEHICLE_LABEL[v]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label>
                Einsatzgebiete <small>Selbstangabe, ein Gebiet pro Zeile – wird gesondert geprüft</small>
                <textarea name="declaredRegions" rows={3} defaultValue={tp?.declaredRegions.join("\n") ?? ""} />
              </label>
            </fieldset>
            {canEdit && <div><button type="submit">Speichern</button></div>}
          </form>
        </section>
      )}
    </AppShell>
  );
}
