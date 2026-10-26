import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Nutzungsbedingungen · TaxiRoute" };

export default function Nutzungsbedingungen() {
  return (
    <LegalPage title="Nutzungsbedingungen" path="/nutzungsbedingungen">
      <h2>1. Geltungsbereich</h2>
      <p>
        Diese Bedingungen gelten für die Nutzung von TaxiRoute durch Unternehmen. TaxiRoute steht nur Unternehmern im Sinne
        des § 1 KSchG offen, nicht Verbrauchern. Betreiber ist [Firmenname, Anschrift].
      </p>

      <h2>2. Rolle von TaxiRoute</h2>
      <p>
        TaxiRoute stellt eine Plattform bereit, auf der Unternehmen Transferaufträge einstellen, Angebote abgeben und
        Aufträge vergeben. Der Beförderungsvertrag kommt ausschließlich zwischen dem Auftraggeber und dem ausführenden
        Unternehmen zustande. TaxiRoute ist nicht Vertragspartner der Beförderung und wickelt keine Zahlungen ab.
      </p>

      <h2>3. Registrierung und Prüfung</h2>
      <p>
        Die Angaben bei der Registrierung müssen wahr und aktuell sein. Beförderungen anbieten und Aufträge übernehmen darf
        nur, wer eine gültige Konzession und eine ausreichende Versicherung nachweist und von TaxiRoute freigeschaltet wurde.
        Das Unternehmen ist selbst dafür verantwortlich, dass es für jede übernommene Fahrt, auch grenzüberschreitend, die
        nötigen Berechtigungen besitzt. Änderungen (etwa der Wegfall der Konzession) sind unverzüglich zu melden.
      </p>

      <h2>4. Aufträge, Angebote und Buchungen</h2>
      <ul>
        <li>Ein Richtpreis bei einer Anfrage ist unverbindlich.</li>
        <li>Ein Angebot bindet den Anbieter bis zum angegebenen Ablauf oder bis es zurückgezogen wird.</li>
        <li>Mit der Annahme eines Angebots oder der Übernahme zum Festpreis kommt eine verbindliche Buchung zu den angezeigten Bedingungen zustande.</li>
        <li>Stornierungen richten sich nach den in der Buchung festgehaltenen Stornobedingungen.</li>
      </ul>

      <h2>5. Pflichten der Nutzer</h2>
      <p>
        Fahrgastdaten dürfen nur für die Durchführung der jeweiligen Fahrt verwendet werden. Zugangsdaten sind geheim zu
        halten. Unzulässig sind falsche Angaben, Scheinaufträge und das Umgehen der Prüfung.
      </p>

      <h2>6. Entgelte</h2>
      <p>
        Während des Pilotbetriebs ist die Nutzung kostenlos. Entgelte werden mindestens [30] Tage vor ihrer Einführung
        angekündigt; Nutzer können dann kündigen.
      </p>

      <h2>7. Haftung</h2>
      <p>
        TaxiRoute haftet nicht für die Durchführung der Fahrten und nicht für Angaben der Nutzer. Für leichte Fahrlässigkeit
        haftet TaxiRoute nicht, ausgenommen bei Personenschäden. [Haftungsregeln rechtlich prüfen lassen.]
      </p>

      <h2>8. Sperre und Kündigung</h2>
      <p>
        Beide Seiten können jederzeit kündigen. TaxiRoute kann Konten bei Verstößen oder bei Wegfall der Voraussetzungen
        einschränken oder sperren.
      </p>

      <h2>9. Recht und Gerichtsstand</h2>
      <p>Es gilt österreichisches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist [Innsbruck].</p>
    </LegalPage>
  );
}
