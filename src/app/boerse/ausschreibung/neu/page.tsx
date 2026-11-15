import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PlaceSelect, VehicleSelect } from "@/components/market";
import { Flash, type SP } from "@/components/ui";
import { actorCan } from "@/server/authz/context";
import { getI18n } from "@/server/i18n";
import { requireOrgActor } from "@/server/web";
import { createTenderAction } from "../../../actions";

/** Ausschreibung erstellen: fünf Pflichtfelder, alles Weitere ist optional. */
export default async function NewTenderPage({ searchParams }: { searchParams: SP }) {
  const { t } = await getI18n();
  const sp = await searchParams;
  const actor = await requireOrgActor();
  if (!actorCan(actor, "transfers.request")) redirect("/boerse");
  return (
    <AppShell actor={actor}>
      <p className="back"><Link href="/boerse?view=meine-ausschreibungen">{t("← Ausschreibungen")}</Link></p>
      <h1>{t("Ausschreibung erstellen")}</h1>
      <p className="sub">{t("Für viele Fahrten auf einer Strecke, zum Beispiel alle Transfers einer Saison. Geprüfte Betriebe bieten einen festen Preis je Fahrt, Sie vergeben an einen.")}</p>
      <Flash searchParams={sp} />
      <form action={createTenderAction} className="stack order-form">
        <section className="card stack">
          <div className="fields">
            <label>{t("Von")}<PlaceSelect name="pickupPlaceId" required /></label>
            <label>{t("Nach")}<PlaceSelect name="dropoffPlaceId" required /></label>
            <label>{t("Zeitraum von")}<input type="date" name="dateFrom" required /></label>
            <label>{t("Zeitraum bis")}<input type="date" name="dateTo" required /></label>
            <label>{t("Fahrten, ungefähr")}<input type="number" name="estimatedTrips" min={2} max={5000} required placeholder="40" /></label>
          </div>
          <label className="check"><input type="checkbox" name="bothDirections" defaultChecked />{t("Hin- und Rückfahrten (beide Richtungen)")}</label>
        </section>
        <details className="card more-actions">
          <summary>{t("Weitere Angaben (optional)")}</summary>
          <div className="stack gap-top">
            <div className="fields">
              <label>{t("Personen je Fahrt")}<input type="number" name="passengers" min={1} max={60} /></label>
              <label>{t("Fahrzeugkategorie")}<VehicleSelect name="vehicleCategory" emptyLabel={t("Beliebig, passend zur Gruppe")} /></label>
              <label>{t("Angebote bis")}{" "}<small>{t("sonst 7 Tage")}</small><input type="date" name="bidDeadline" /></label>
            </div>
            <label>{t("Hinweise")}<textarea name="notes" rows={3} maxLength={1000} placeholder={t("z. B. Samstage mit vielen Fahrten, Skigepäck, Abrechnung monatlich")} /></label>
          </div>
        </details>
        <div><button type="submit" className="accent">{t("Ausschreibung veröffentlichen")}</button></div>
      </form>
    </AppShell>
  );
}
