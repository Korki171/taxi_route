# TaxiRoute

B2B-Auftragsbörse für Taxi- und Transferunternehmen und Reisebüros (Start: Tirol ↔ Flughafen München).

Architektur, Datenmodell und Phasenplan: [docs/ARCHITEKTUR.md](docs/ARCHITEKTUR.md)

## Stand

**Phase 2:** Registrierung von Taxiunternehmen und Reisebüros, Anmeldung, Mitarbeiter mit Rollen und
Einladungen, Unternehmensprofile, Nachweis-Upload, Verifizierung je Geschäftsfunktion durch
Plattformadmins, Sperren/Einschränken von Konten, Audit-Protokoll.

**Phase 3:** Auftragsbörse unter `/boerse` mit Filtern, Festpreis-Übernahme und Preisangeboten, Vergabe
ohne Doppelannahme, Buchungen mit bestätigtem Preis und Verlauf, Fahrzeuge und freie Fahrten unter
`/flotte`, Rückfahrt-Matching (Umweg und Wartezeit geschätzt, noch ohne Routingdienst).
Reisebüros können Aufträge einstellen und Angebote annehmen. Das eigene Reisebüro-Dashboard, gezielte
Angebotsanfragen und PDF-Bestätigungen (Phase 4) sowie Benachrichtigungen (Phase 5) fehlen noch.

Die Startseite (`/`) ist die öffentliche Landing Page, angemeldete Nutzer landen in der Übersicht.

## Lokal starten

Voraussetzungen: Node.js 20+, PostgreSQL 14+.

```bash
npm install
cp .env.example .env                 # DATABASE_URL anpassen
npx prisma migrate dev               # Datenbank anlegen
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='mind-12-zeichen' SEED_DEMO=1 npm run db:seed
npm run dev                          # http://localhost:3000
```

`SEED_DEMO=1` legt zusätzlich `taxi@demo.test` und `reise@demo.test` (Passwort `demo-passwort-123`) an.

Beispieldaten für die Börse (nur lokal): `npm run db:demo` legt fünf als „Demo“ benannte, ohne Prüfung
freigeschaltete Unternehmen mit Aufträgen, Angeboten, Buchungen und freien Fahrten an (ersetzt vorhandene
Demo-Unternehmen). Anmeldung z. B. mit `taxi@demo.test` oder `reise@demo.test`, Passwort `demo-passwort-123`.

## Vercel

Das Projekt ist für Vercel vorbereitet (`vercel-build`, `postinstall: prisma generate`).

- **Nur Landing Page:** Repository auf vercel.com/new importieren und ohne Umgebungsvariablen deployen.
  Die Startseite braucht keine Datenbank. Anmeldung und Registrierung funktionieren dann noch nicht.
- **Ganze App:** Eine PostgreSQL-Datenbank anlegen (z. B. Neon über den Vercel Marketplace, Region EU)
  und `DATABASE_URL` setzen. `vercel-build` führt dann vor dem Build `prisma migrate deploy` aus.
  Den Plattformadmin einmalig mit `npm run db:seed` gegen diese Datenbank anlegen.

## Tests

Die Tests laufen gegen eine eigene Datenbank (`.env.test`, Standard `taxiroute_test`), deren Tabellen
vor jedem Test geleert werden.

```bash
createdb taxiroute_test
npm test
```

## Prüfablauf (Beförderungsfunktion)

1. Unternehmen lädt unter **Nachweise** Taxi-/Mietwagenkonzession und Versicherungsnachweis hoch.
2. Unter **Unternehmen** wird die Prüfung der Funktion „Beförderungsunternehmen“ beantragt.
3. Admin akzeptiert unter **Administration** die Dokumente und gibt die Funktion frei.
