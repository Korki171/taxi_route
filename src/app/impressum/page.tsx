import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Impressum · TaxiRoute" };

export default function Impressum() {
  return (
    <LegalPage title="Impressum" path="/impressum">
      <p>Angaben gemäß § 5 E-Commerce-Gesetz, § 14 Unternehmensgesetzbuch und § 25 Mediengesetz.</p>
      <dl className="kv">
        <dt>Betreiber</dt><dd>[Firmenname bzw. Vor- und Nachname]</dd>
        <dt>Anschrift</dt><dd>[Straße Nr., PLZ Ort, Österreich]</dd>
        <dt>E-Mail</dt><dd>[hallo@taxiroute.at]</dd>
        <dt>Telefon</dt><dd>[+43 …]</dd>
        <dt>Rechtsform</dt><dd>[z. B. Einzelunternehmen oder GmbH]</dd>
        <dt>Firmenbuch</dt><dd>[Firmenbuchnummer, Firmenbuchgericht, falls eingetragen]</dd>
        <dt>UID-Nummer</dt><dd>[ATU…]</dd>
        <dt>Gewerbe</dt><dd>[Gewerbewortlaut, zuständige Gewerbebehörde]</dd>
        <dt>Kammer</dt><dd>[Wirtschaftskammer Tirol, Fachgruppe]</dd>
      </dl>
      <h2>Blattlinie</h2>
      <p>Informationen über TaxiRoute, eine Auftragsbörse für Personenbeförderung zwischen Unternehmen.</p>
      <h2>Streitbeilegung</h2>
      <p>
        TaxiRoute richtet sich ausschließlich an Unternehmen. Zur Teilnahme an einem Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle sind wir nicht verpflichtet und nicht bereit.
      </p>
    </LegalPage>
  );
}
