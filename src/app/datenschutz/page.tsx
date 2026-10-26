import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Datenschutz · TaxiRoute" };

export default function Datenschutz() {
  return (
    <LegalPage title="Datenschutzerklärung" path="/datenschutz">
      <h2>1. Verantwortlicher</h2>
      <p>[Firmenname, Anschrift, E-Mail]. Kontakt in Datenschutzfragen: [datenschutz@taxiroute.at].</p>

      <h2>2. Welche Daten wir verarbeiten und wofür</h2>
      <ul>
        <li>
          <strong>Konto und Unternehmen:</strong> Name, E-Mail, Passwort (nur als Hash gespeichert), Rolle im Unternehmen,
          Firmendaten. Zweck: Bereitstellung der Plattform (Art. 6 Abs. 1 lit. b DSGVO).
        </li>
        <li>
          <strong>Prüfunterlagen:</strong> Konzession, Versicherungsnachweis und ähnliche Dokumente. Zweck: Prüfung, ob ein
          Unternehmen Beförderungen anbieten darf (Art. 6 Abs. 1 lit. b und f DSGVO).
        </li>
        <li>
          <strong>Aufträge und Buchungen:</strong> Strecke, Zeit, Personenzahl, Gepäck, Preise, Verlauf. Namen und Telefonnummern
          von Fahrgästen sehen nur der Auftraggeber und das ausführende Unternehmen. Zweck: Vermittlung und Durchführung der
          Fahrten (Art. 6 Abs. 1 lit. b DSGVO).
        </li>
        <li>
          <strong>Sicherheit:</strong> Protokoll wichtiger Aktionen, Anmeldeversuche je E-Mail und IP-Adresse (höchstens 24
          Stunden). Zweck: Schutz vor Missbrauch (Art. 6 Abs. 1 lit. f DSGVO).
        </li>
      </ul>

      <h2>3. Cookies</h2>
      <p>
        Wir verwenden nur technisch notwendige Cookies: ein Sitzungs-Cookie für die Anmeldung und ein Cookie für die gewählte
        Sprache. Es gibt keine Werbe- oder Analyse-Cookies. Schriften werden von unserem eigenen Server geladen.
      </p>

      <h2>4. Empfänger und Auftragsverarbeiter</h2>
      <ul>
        <li>Hosting: Vercel Inc. [Region, Vertrag zur Auftragsverarbeitung]</li>
        <li>Datenbank: [Anbieter, z. B. Neon, Region EU (Frankfurt)]</li>
        <li>E-Mail-Versand: Resend [Region, Vertrag zur Auftragsverarbeitung]</li>
      </ul>
      <p>
        Soweit Daten in die USA übermittelt werden, stützen wir uns auf das EU-US Data Privacy Framework oder
        Standardvertragsklauseln. [Vor Livebetrieb je Anbieter prüfen.]
      </p>

      <h2>5. Speicherdauer</h2>
      <p>
        Wir speichern Daten, solange das Konto besteht, und danach nur, soweit gesetzliche Aufbewahrungspflichten bestehen
        (z. B. sieben Jahre für buchhaltungsrelevante Unterlagen). [Fristen für Prüfunterlagen und Buchungen festlegen.]
      </p>

      <h2>6. Ihre Rechte</h2>
      <p>
        Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch. Wenden
        Sie sich dazu an [datenschutz@taxiroute.at]. Sie können sich außerdem bei der österreichischen Datenschutzbehörde
        (www.dsb.gv.at) beschweren.
      </p>
    </LegalPage>
  );
}
