import { AppShell } from "@/components/AppShell";
import { OrgProfileFields } from "@/components/OrgProfileFields";
import { Badge, Flash, type SP } from "@/components/ui";
import { CAPABILITY_LABEL, VEHICLE_LABEL, VERIFICATION_LABEL } from "@/lib/labels";
import { actorCan } from "@/server/authz/context";
import { getOwnOrganization } from "@/server/services/organizations";
import { requireOrgActor } from "@/server/web";
import type { Capability, VehicleCategory } from "@prisma/client";
import { requestCapabilityAction, updateProfileAction, updateTransportProfileAction } from "../actions";
import { getI18n } from "@/server/i18n";
import Link from "next/link";
import { PLAN_BY_ID, planStatus } from "@/lib/plans";

const ALL_CAPS: Capability[] = ["TRANSFER_BOOKER", "TRANSPORT_PROVIDER"];

export default async function OrganizationPage({ searchParams }: { searchParams: SP }) {
  const { t, f } = await getI18n();
  const sp = await searchParams;
  const actor = await requireOrgActor();
  const org = await getOwnOrganization(actor);
  const canEdit = actorCan(actor, "org.update");
  const canRequest = actorCan(actor, "capabilities.request");
  const capByType = new Map(org.capabilities.map((c) => [c.capability, c]));
  const tp = org.transportProfile;
  const ps = planStatus(org);
  const plan = org.plan ? PLAN_BY_ID[org.plan] : null;
  const vehicles = org._count.vehicles;

  return (
    <AppShell actor={actor}>
      <h1>{t("Unternehmen")}</h1>
      <p className="sub">{t("Stammdaten, Beförderungsdaten und Verifizierung")}</p>
      <Flash searchParams={sp} />

      <section className="card">
        <h2>{t("Tarif")}</h2>
        {ps.kind === "FREE_ROLE" ? (
          <p>
            <Badge status="ACTIVE">{t("Kostenlos")}</Badge>{" "}
            {t("Für Reisebüros, Hotels und Reiseveranstalter ist Transferborsa kostenlos.")}
          </p>
        ) : (
          <>
            <dl className="kv">
              <dt>{t("Tarif")}</dt>
              <dd>
                {plan ? `${plan.name} · ${f.money(plan.priceCents)} ${t("netto/Monat")}` : t("Noch kein Tarif")}{" "}
                {ps.kind === "TRIAL" && <Badge status="ACTIVE">{t("Kostenlos bis {date}", { date: f.date(ps.until) })}</Badge>}
                {ps.kind === "ACTIVE" && <Badge status="ACTIVE">{t("Aktiv")}</Badge>}
                {ps.kind === "NONE" && <Badge status="PENDING">{t("Nicht freigeschaltet")}</Badge>}
              </dd>
              <dt>{t("Fahrzeuge")}</dt>
              <dd>
                {plan?.vehicleLimit != null
                  ? t("{n} von {max} aktiv", { n: vehicles, max: plan.vehicleLimit })
                  : t("{n} aktiv", { n: vehicles })}
              </dd>
              <dt>{t("Abrechnung")}</dt>
              <dd>{ps.kind === "TRIAL" ? t("Danach monatlich per Rechnung") : t("Monatlich per Rechnung")}</dd>
            </dl>
            <p className="muted">
              {ps.kind === "NONE"
                ? t("Ihr Tarif wird nach der Prüfung von uns freigeschaltet.")
                : t("Für einen Tarifwechsel melden Sie sich bitte bei uns.")}{" "}
              <Link href="/preise">{t("Alle Tarife ansehen")}</Link>
            </p>
          </>
        )}
      </section>

      <section className="card">
        <h2>{t("Geschäftsfunktionen und Prüfstatus")}</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t("Funktion")}</th><th>{t("Status")}</th><th>{t("Hinweis")}</th><th></th></tr></thead>
            <tbody>
              {ALL_CAPS.map((cap) => {
                const c = capByType.get(cap);
                const status = c?.status;
                const requestable = canRequest && (!status || status === "UNVERIFIED" || status === "REJECTED");
                return (
                  <tr key={cap}>
                    <td>{t(CAPABILITY_LABEL[cap])}</td>
                    <td>{status ? <Badge status={status}>{t(VERIFICATION_LABEL[status])}</Badge> : <span className="muted">{t("Nicht beantragt")}</span>}</td>
                    <td className="muted">{c?.reviewNote ?? (cap === "TRANSPORT_PROVIDER" ? t("Erfordert Konzession und Versicherungsnachweis.") : "")}</td>
                    <td>
                      {requestable && (
                        <form action={requestCapabilityAction}>
                          <input type="hidden" name="capability" value={cap} />
                          <button type="submit" className="secondary">{t("Prüfung beantragen")}</button>
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
        <h2>{t("Unternehmensdaten")}</h2>
        <form action={updateProfileAction} className="stack">
          <OrgProfileFields org={org} disabled={!canEdit} />
          {canEdit && <div><button type="submit">{t("Speichern")}</button></div>}
        </form>
      </section>

      {capByType.has("TRANSPORT_PROVIDER") && (
        <section className="card">
          <h2>{t("Beförderungsbetrieb")}</h2>
          <form action={updateTransportProfileAction} className="stack">
            <fieldset disabled={!canEdit} className="bare stack">
              <div className="fields">
                <label>{t("Konzessionsnummer")}<input name="concessionNumber" defaultValue={tp?.concessionNumber ?? ""} /></label>
                <label>{t("Anzahl Fahrzeuge")}<input name="fleetSize" type="number" min={0} defaultValue={tp?.fleetSize ?? ""} /></label>
              </div>
              <fieldset>
                <legend>{t("Verfügbare Fahrzeugkategorien")}</legend>
                <div className="checks">
                  {(Object.keys(VEHICLE_LABEL) as VehicleCategory[]).map((v) => (
                    <label key={v}>
                      <input type="checkbox" name="vehicleCategories" value={v} defaultChecked={tp?.vehicleCategories.includes(v)} />
                      {t(VEHICLE_LABEL[v])}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label>
                {t("Einsatzgebiete")}{" "}<small>{t("Selbstangabe, ein Gebiet pro Zeile – wird gesondert geprüft")}</small>
                <textarea name="declaredRegions" rows={3} defaultValue={tp?.declaredRegions.join("\n") ?? ""} />
              </label>
            </fieldset>
            {canEdit && <div><button type="submit">{t("Speichern")}</button></div>}
          </form>
        </section>
      )}
    </AppShell>
  );
}
