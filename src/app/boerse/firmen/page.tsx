import Link from "next/link";
import { redirect } from "next/navigation";
import type { VehicleCategory } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { VehicleSelect } from "@/components/market";
import { Badge, Flash, Stars, type SP } from "@/components/ui";
import { VEHICLE_LABEL } from "@/lib/labels";
import { actorCan } from "@/server/authz/context";
import { getI18n } from "@/server/i18n";
import { listProviderDirectory } from "@/server/services/marketplace";
import { listPartners } from "@/server/services/partners";
import { ratingSummaries } from "@/server/services/ratings";
import { requireOrgActor } from "@/server/web";
import { addPartnerAction } from "../../actions";

/** Firmenverzeichnis: alle geprüften Beförderungsunternehmen, mit Suche, Bewertung und Direktanfrage. */
export default async function DirectoryPage({ searchParams }: { searchParams: SP }) {
  const { t } = await getI18n();
  const sp = await searchParams;
  const actor = await requireOrgActor();
  if (!actorCan(actor, "transfers.request")) redirect("/boerse");
  const q = (sp.q ?? "").trim().toLowerCase();
  const cat = sp.vehicleCategory as VehicleCategory | undefined;
  const [all, partners] = await Promise.all([listProviderDirectory(actor), listPartners(actor)]);
  const partnerIds = new Set(partners.map((p) => p.id));
  const rows = all.filter((o) =>
    (!q || `${o.name} ${o.city} ${(o.transportProfile?.declaredRegions ?? []).join(" ")}`.toLowerCase().includes(q)) &&
    (!cat || (o.transportProfile?.vehicleCategories ?? []).includes(cat)),
  );
  const stars = await ratingSummaries(rows.map((o) => o.id));

  return (
    <AppShell actor={actor}>
      <p className="back"><Link href="/boerse">{t("← Zur Börse")}</Link></p>
      <h1>{t("Firmenverzeichnis")}</h1>
      <p className="sub">{t("Alle geprüften Beförderungsunternehmen. Fragen Sie eine Firma direkt an oder nehmen Sie sie als Partner auf.")}</p>
      <Flash searchParams={sp} />
      <form className="card filters" method="get" aria-label={t("Filter")}>
        <label>{t("Name oder Ort")}<input name="q" defaultValue={sp.q} /></label>
        <label>{t("Fahrzeug")}<VehicleSelect name="vehicleCategory" defaultValue={sp.vehicleCategory} emptyLabel={t("Alle")} /></label>
        <div className="actions">
          <button type="submit">{t("Suchen")}</button>
          {(q || cat) && <Link href="/boerse/firmen" className="btn secondary">{t("Zurücksetzen")}</Link>}
        </div>
      </form>
      <section className="card">
        {rows.length === 0 ? <p className="empty">{t("Keine Unternehmen gefunden.")}</p> : (
          <div className="table-wrap">
            <table className="responsive">
              <thead><tr><th>{t("Unternehmen")}</th><th>{t("Fahrzeuge")}</th><th>{t("Bewertung")}</th><th></th></tr></thead>
              <tbody>
                {rows.map((o) => {
                  const cats = o.transportProfile?.vehicleCategories ?? [];
                  return (
                    <tr key={o.id}>
                      <td>
                        {o.name} <Badge status="VERIFIED">{t("Konzession geprüft")}</Badge>
                        <span className="price-note">{o.city}, {o.country}{o.trips > 0 ? ` · ${t(o.trips === 1 ? "1 Fahrt mit Ihnen" : "{n} Fahrten mit Ihnen", { n: o.trips })}` : ""}{partnerIds.has(o.id) ? ` · ${t("Ihr Partner")}` : ""}</span>
                      </td>
                      <td data-label={t("Fahrzeuge")}>
                        {o.transportProfile?.fleetSize ? t("{n} Fahrzeuge", { n: o.transportProfile.fleetSize }) : <span className="muted">–</span>}
                        {cats.length > 0 && <span className="price-note">{cats.map((c) => t(VEHICLE_LABEL[c])).join(", ")}</span>}
                      </td>
                      <td data-label={t("Bewertung")}>{stars.has(o.id) ? <Stars rating={stars.get(o.id)} /> : <span className="muted">{t("noch keine")}</span>}</td>
                      <td>
                        <div className="inline">
                          <Link href={`/boerse/neu?partner=${o.id}`} className="btn">{t("Anfragen")}</Link>
                          {!partnerIds.has(o.id) && (
                            <form action={addPartnerAction}>
                              <input type="hidden" name="partnerOrgId" value={o.id} />
                              <input type="hidden" name="back" value="/boerse/firmen" />
                              <button type="submit" className="link">{t("Als Partner")}</button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
