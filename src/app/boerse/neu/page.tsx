import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PlaceSelect, ProviderPicker, VehicleSelect } from "@/components/market";
import { Flash, type SP } from "@/components/ui";
import { HANDOFF_SHARE_OPTIONS } from "@/lib/handoff";
import { actorCan } from "@/server/authz/context";
import { listProviderDirectory } from "@/server/services/marketplace";
import { requireOrgActor } from "@/server/web";
import { createTransferRequestAction } from "../../actions";
import { getI18n } from "@/server/i18n";

export default async function NewRequestPage({ searchParams }: { searchParams: SP }) {
  const { t, f } = await getI18n();
  const sp = await searchParams;
  const actor = await requireOrgActor();
  if (!actorCan(actor, "transfers.request")) redirect("/boerse?error=" + encodeURIComponent("Ihr Unternehmen ist noch nicht als Auftraggeber freigegeben."));
  const providers = await listProviderDirectory(actor);
  // ?partner=<id> (aus dem Dashboard) wählt ein Unternehmen vor und stellt auf gezielte Anfrage.
  const preselected = sp.partner ? [sp.partner] : [];
  const targeted = !!sp.partner || sp.gezielt === "1";

  return (
    <AppShell actor={actor}>
      <p className="back"><Link href="/boerse?view=meine">{t("← Eigene Aufträge")}</Link></p>
      <h1>{t("Transferauftrag einstellen")}</h1>
      <p className="sub">{t("Sichtbar für geprüfte Beförderungsunternehmen. Genaue Adressen und Fahrgastdaten sehen nur Sie und das Unternehmen, das den Auftrag erhält.")}</p>
      <Flash searchParams={sp} />
      <form action={createTransferRequestAction} className="stack order-form">
        <section className="card stack">
          <div className="fields">
            <label>{t("Von")}<PlaceSelect name="pickupPlaceId" required /></label>
            <label>{t("Nach")}<PlaceSelect name="dropoffPlaceId" required /></label>
            <label>{t("Abholung")}<input type="datetime-local" name="pickupAt" required /></label>
            <label>{t("Personen")}<input type="number" name="passengers" min={1} max={60} required defaultValue={2} /></label>
          </div>
          <fieldset>
            <legend>{t("Kommen die Fahrgäste mit dem Flieger?")}</legend>
            <div className="choice">
              <label><input type="radio" name="byPlane" value="no" defaultChecked />{t("Nein")}</label>
              <label><input type="radio" name="byPlane" value="yes" />{t("Ja, mit dem Flieger")}</label>
            </div>
          </fieldset>
          <div className="fields flight-fields">
            <label>{t("Flugnummer")}<input name="flightNumber" maxLength={12} placeholder={t("LH 2154")} /></label>
            <label>{t("Landung laut Flugplan")}<input type="datetime-local" name="flightArrivalAt" /></label>
          </div>
        </section>

        <section className="card stack">
          <label>{t("Festpreis in €")}<input name="price" inputMode="decimal" placeholder="180,00" required={!targeted} /></label>
          <p className="price-note">{t("Das erste geprüfte Unternehmen kann den Auftrag direkt zu diesem Preis übernehmen. Die Abrechnung läuft direkt zwischen den Unternehmen.")}</p>
        </section>

        <details className="card more-actions" open={targeted}>
          <summary>{t("Weitere Angaben (optional)")}</summary>
          <div className="stack gap-top">
            <div className="fields">
              <label>{t("Abholadresse")}{" "}<small>{t("nur für Beteiligte")}</small><input name="pickupAddress" maxLength={200} placeholder={t("z. B. Terminal 2, Ankunft")} /></label>
              <label>{t("Zieladresse")}{" "}<small>{t("nur für Beteiligte")}</small><input name="dropoffAddress" maxLength={200} /></label>
              <label>{t("Zeitfenster ± Minuten")}<input type="number" name="pickupWindowMinutes" min={0} max={240} defaultValue={0} /></label>
              <label>{t("Gepäckstücke")}<input type="number" name="luggage" min={0} max={80} defaultValue={2} /></label>
              <label>{t("Skiausrüstung")}<input type="number" name="skiEquipment" min={0} max={60} defaultValue={0} /></label>
              <label>{t("Kindersitze")}<input type="number" name="childSeats" min={0} max={10} defaultValue={0} /></label>
              <label>{t("Fahrzeugkategorie")}<VehicleSelect name="vehicleCategory" emptyLabel={t("Beliebig, passend zur Gruppe")} /></label>
              <label>{t("Sondergepäck")}<input name="specialLuggage" maxLength={200} placeholder={t("Rollstuhl, Fahrrad, Golfbag")} /></label>
              <label>{t("Fahrgast Name")}<input name="passengerName" maxLength={120} /></label>
              <label>{t("Fahrgast Telefon")}<input name="passengerPhone" type="tel" maxLength={40} /></label>
              <label>{t("Angebote bis")}<input type="datetime-local" name="quoteDeadline" /></label>
              <label>{t("Ihre Referenz")}{" "}<small>{t("nur für Sie sichtbar")}</small><input name="clientReference" maxLength={60} /></label>
              <label>{t("Ihr Anteil")}{" "}<small>{t("vom Fahrpreis")}</small>
                <select name="handoffSharePercent" defaultValue="0">
                  {HANDOFF_SHARE_OPTIONS.map((p) => <option key={p} value={p}>{p === 0 ? t("Kein Anteil") : `${p} %`}</option>)}
                </select>
              </label>
            </div>
            <label>{t("Hinweise zur Abholung")}<textarea name="pickupNotes" rows={2} maxLength={500} placeholder={t("Namensschild, Treffpunkt")} /></label>
            <label>{t("Besondere Anforderungen")}<textarea name="requirements" rows={2} maxLength={500} /></label>
            <label>{t("Buchungsbedingungen")}<textarea name="bookingTerms" rows={2} maxLength={1000} placeholder={t("Wartezeit am Flughafen inklusive bis 60 Minuten nach Landung")} /></label>
            <label>{t("Stornobedingungen")}<textarea name="cancellationTerms" rows={2} maxLength={500} placeholder={t("Kostenlos bis 24 Stunden vor Abholung")} /></label>
            <fieldset>
              <legend>{t("Preisart")}</legend>
              <div className="choice">
                <label><input type="radio" name="priceMode" value="FIXED" defaultChecked />{t("Festpreis")}</label>
                <label><input type="radio" name="priceMode" value="NEGOTIABLE" />{t("Angebote einholen")}</label>
              </div>
              <p className="price-note">{t("Bei „Angebote einholen“ ist der Preis oben nur ein Richtpreis. Unternehmen nennen ihren Preis, Sie wählen aus.")}</p>
            </fieldset>
            <fieldset id="anbieter">
              <legend>{t("Wer soll anbieten?")}</legend>
              <div className="choice">
                <label><input type="radio" name="visibility" value="MARKET" defaultChecked={!targeted} />{t("Ganze Börse")}</label>
                <label><input type="radio" name="visibility" value="INVITED" defaultChecked={targeted} />{t("Nur ausgewählte Unternehmen")}</label>
              </div>
            </fieldset>
            <ProviderPicker providers={providers} selected={preselected} />
          </div>
        </details>

        <div><button type="submit" className="accent">{t("Auftrag veröffentlichen")}</button></div>
      </form>
    </AppShell>
  );
}
