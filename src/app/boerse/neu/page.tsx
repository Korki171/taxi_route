import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PlaceSelect, VehicleSelect } from "@/components/market";
import { Flash, type SP } from "@/components/ui";
import { actorCan } from "@/server/authz/context";
import { requireOrgActor } from "@/server/web";
import { createTransferRequestAction } from "../../actions";

export default async function NewRequestPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const actor = await requireOrgActor();
  if (!actorCan(actor, "transfers.request")) redirect("/boerse?error=" + encodeURIComponent("Ihr Unternehmen ist noch nicht als Auftraggeber freigegeben."));

  return (
    <AppShell actor={actor}>
      <p className="muted" style={{ margin: 0 }}><Link href="/boerse?view=meine">← Eigene Aufträge</Link></p>
      <h1>Transferauftrag einstellen</h1>
      <p className="sub">Sichtbar für geprüfte Beförderungsunternehmen. Genaue Adressen und Fahrgastdaten sehen nur Sie und das Unternehmen, das den Auftrag erhält.</p>
      <Flash searchParams={sp} />
      <form action={createTransferRequestAction} className="stack">
        <section className="card stack">
          <h2>Strecke und Zeit</h2>
          <div className="fields">
            <label>Abholort<PlaceSelect name="pickupPlaceId" required /></label>
            <label>Zielort<PlaceSelect name="dropoffPlaceId" required /></label>
            <label>Abholadresse <small>nur für Beteiligte</small><input name="pickupAddress" maxLength={200} placeholder="z. B. Terminal 2, Ankunft" /></label>
            <label>Zieladresse <small>nur für Beteiligte</small><input name="dropoffAddress" maxLength={200} /></label>
            <label>Abholung<input type="datetime-local" name="pickupAt" required /></label>
            <label>Zeitfenster ± Minuten<input type="number" name="pickupWindowMinutes" min={0} max={240} defaultValue={0} /></label>
            <label>Flugnummer<input name="flightNumber" maxLength={12} placeholder="LH 2154" /></label>
            <label>Landung laut Flugplan<input type="datetime-local" name="flightArrivalAt" /></label>
          </div>
          <label>Hinweise zur Abholung <small>nur für Beteiligte</small><textarea name="pickupNotes" rows={2} maxLength={500} placeholder="Namensschild, Treffpunkt" /></label>
        </section>

        <section className="card stack">
          <h2>Fahrgäste, Gepäck, Fahrzeug</h2>
          <div className="fields">
            <label>Personen<input type="number" name="passengers" min={1} max={60} required defaultValue={2} /></label>
            <label>Gepäckstücke<input type="number" name="luggage" min={0} max={80} defaultValue={2} /></label>
            <label>Skiausrüstung<input type="number" name="skiEquipment" min={0} max={60} defaultValue={0} /></label>
            <label>Kindersitze<input type="number" name="childSeats" min={0} max={10} defaultValue={0} /></label>
            <label>Fahrzeugkategorie<VehicleSelect name="vehicleCategory" emptyLabel="Beliebig, passend zur Gruppe" /></label>
            <label>Sondergepäck<input name="specialLuggage" maxLength={200} placeholder="Rollstuhl, Fahrrad, Golfbag" /></label>
          </div>
          <label>Besondere Anforderungen<textarea name="requirements" rows={2} maxLength={500} /></label>
        </section>

        <section className="card stack">
          <h2>Preis und Bedingungen</h2>
          <fieldset>
            <legend>Preismodell</legend>
            <div className="checks">
              <label><input type="radio" name="priceMode" value="FIXED" defaultChecked /> Festpreis: das erste geprüfte Unternehmen kann direkt verbindlich übernehmen</label>
              <label><input type="radio" name="priceMode" value="NEGOTIABLE" /> Verhandelbar: Unternehmen geben Angebote ab, Sie wählen aus</label>
            </div>
          </fieldset>
          <div className="fields">
            <label>Preis in € <small>beim Festpreis Pflicht, sonst unverbindlicher Richtpreis</small><input name="price" inputMode="decimal" placeholder="180,00" /></label>
            <label>Angebote bis <small>nur bei verhandelbarem Preis</small><input type="datetime-local" name="quoteDeadline" /></label>
            <label>Ihre Referenz <small>intern, nur für Sie sichtbar</small><input name="clientReference" maxLength={60} /></label>
          </div>
          <label>Buchungsbedingungen<textarea name="bookingTerms" rows={2} maxLength={1000} placeholder="Wartezeit am Flughafen inklusive bis 60 Minuten nach Landung" /></label>
          <label>Stornobedingungen<textarea name="cancellationTerms" rows={2} maxLength={500} placeholder="Kostenlos bis 24 Stunden vor Abholung" /></label>
          <p className="price-note">Die Plattform wickelt keine Zahlungen ab. Der bestätigte Preis wird in der Buchung festgehalten, die Abrechnung erfolgt direkt zwischen den Unternehmen.</p>
        </section>

        <section className="card stack">
          <h2>Fahrgast <small className="muted">nur für Beteiligte sichtbar</small></h2>
          <div className="fields">
            <label>Name<input name="passengerName" maxLength={120} /></label>
            <label>Telefon<input name="passengerPhone" type="tel" maxLength={40} /></label>
          </div>
        </section>

        <div><button type="submit">Auftrag veröffentlichen</button></div>
      </form>
    </AppShell>
  );
}
