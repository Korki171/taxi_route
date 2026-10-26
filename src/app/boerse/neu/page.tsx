import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PlaceSelect, VehicleSelect } from "@/components/market";
import { Flash, type SP } from "@/components/ui";
import { actorCan } from "@/server/authz/context";
import { requireOrgActor } from "@/server/web";
import { createTransferRequestAction } from "../../actions";
import { getI18n } from "@/server/i18n";

export default async function NewRequestPage({ searchParams }: { searchParams: SP }) {
  const { t, f } = await getI18n();
  const sp = await searchParams;
  const actor = await requireOrgActor();
  if (!actorCan(actor, "transfers.request")) redirect("/boerse?error=" + encodeURIComponent("Ihr Unternehmen ist noch nicht als Auftraggeber freigegeben."));

  return (
    <AppShell actor={actor}>
      <p className="muted" style={{ margin: 0 }}><Link href="/boerse?view=meine">{t("← Eigene Aufträge")}</Link></p>
      <h1>{t("Transferauftrag einstellen")}</h1>
      <p className="sub">{t("Sichtbar für geprüfte Beförderungsunternehmen. Genaue Adressen und Fahrgastdaten sehen nur Sie und das Unternehmen, das den Auftrag erhält.")}</p>
      <Flash searchParams={sp} />
      <form action={createTransferRequestAction} className="stack">
        <section className="card stack">
          <h2>{t("Strecke und Zeit")}</h2>
          <div className="fields">
            <label>{t("Abholort")}<PlaceSelect name="pickupPlaceId" required /></label>
            <label>{t("Zielort")}<PlaceSelect name="dropoffPlaceId" required /></label>
            <label>{t("Abholadresse")}{" "}<small>{t("nur für Beteiligte")}</small><input name="pickupAddress" maxLength={200} placeholder={t("z. B. Terminal 2, Ankunft")} /></label>
            <label>{t("Zieladresse")}{" "}<small>{t("nur für Beteiligte")}</small><input name="dropoffAddress" maxLength={200} /></label>
            <label>{t("Abholung")}<input type="datetime-local" name="pickupAt" required /></label>
            <label>{t("Zeitfenster ± Minuten")}<input type="number" name="pickupWindowMinutes" min={0} max={240} defaultValue={0} /></label>
            <label>{t("Flugnummer")}<input name="flightNumber" maxLength={12} placeholder={t("LH 2154")} /></label>
            <label>{t("Landung laut Flugplan")}<input type="datetime-local" name="flightArrivalAt" /></label>
          </div>
          <label>{t("Hinweise zur Abholung")}{" "}<small>{t("nur für Beteiligte")}</small><textarea name="pickupNotes" rows={2} maxLength={500} placeholder={t("Namensschild, Treffpunkt")} /></label>
        </section>

        <section className="card stack">
          <h2>{t("Fahrgäste, Gepäck, Fahrzeug")}</h2>
          <div className="fields">
            <label>{t("Personen")}<input type="number" name="passengers" min={1} max={60} required defaultValue={2} /></label>
            <label>{t("Gepäckstücke")}<input type="number" name="luggage" min={0} max={80} defaultValue={2} /></label>
            <label>{t("Skiausrüstung")}<input type="number" name="skiEquipment" min={0} max={60} defaultValue={0} /></label>
            <label>{t("Kindersitze")}<input type="number" name="childSeats" min={0} max={10} defaultValue={0} /></label>
            <label>{t("Fahrzeugkategorie")}<VehicleSelect name="vehicleCategory" emptyLabel={t("Beliebig, passend zur Gruppe")} /></label>
            <label>{t("Sondergepäck")}<input name="specialLuggage" maxLength={200} placeholder={t("Rollstuhl, Fahrrad, Golfbag")} /></label>
          </div>
          <label>{t("Besondere Anforderungen")}<textarea name="requirements" rows={2} maxLength={500} /></label>
        </section>

        <section className="card stack">
          <h2>{t("Preis und Bedingungen")}</h2>
          <fieldset>
            <legend>{t("Preismodell")}</legend>
            <div className="checks">
              <label><input type="radio" name="priceMode" value="FIXED" defaultChecked />{" "}{t("Festpreis: das erste geprüfte Unternehmen kann direkt verbindlich übernehmen")}</label>
              <label><input type="radio" name="priceMode" value="NEGOTIABLE" />{" "}{t("Verhandelbar: Unternehmen geben Angebote ab, Sie wählen aus")}</label>
            </div>
          </fieldset>
          <div className="fields">
            <label>{t("Preis in €")}{" "}<small>{t("beim Festpreis Pflicht, sonst unverbindlicher Richtpreis")}</small><input name="price" inputMode="decimal" placeholder="180,00" /></label>
            <label>{t("Angebote bis")}{" "}<small>{t("nur bei verhandelbarem Preis")}</small><input type="datetime-local" name="quoteDeadline" /></label>
            <label>{t("Ihre Referenz")}{" "}<small>{t("intern, nur für Sie sichtbar")}</small><input name="clientReference" maxLength={60} /></label>
          </div>
          <label>{t("Buchungsbedingungen")}<textarea name="bookingTerms" rows={2} maxLength={1000} placeholder={t("Wartezeit am Flughafen inklusive bis 60 Minuten nach Landung")} /></label>
          <label>{t("Stornobedingungen")}<textarea name="cancellationTerms" rows={2} maxLength={500} placeholder={t("Kostenlos bis 24 Stunden vor Abholung")} /></label>
          <p className="price-note">{t("Die Plattform wickelt keine Zahlungen ab. Der bestätigte Preis wird in der Buchung festgehalten, die Abrechnung erfolgt direkt zwischen den Unternehmen.")}</p>
        </section>

        <section className="card stack">
          <h2>{t("Fahrgast")}{" "}<small className="muted">{t("nur für Beteiligte sichtbar")}</small></h2>
          <div className="fields">
            <label>{t("Name")}<input name="passengerName" maxLength={120} /></label>
            <label>{t("Telefon")}<input name="passengerPhone" type="tel" maxLength={40} /></label>
          </div>
        </section>

        <div><button type="submit">{t("Auftrag veröffentlichen")}</button></div>
      </form>
    </AppShell>
  );
}
