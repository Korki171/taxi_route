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
Angebotsanfragen und PDF-Bestätigungen (Phase 4) fehlen noch.

**Pilotbetrieb:** App und Landing Page auf Deutsch und Englisch (Umschalter oben rechts, Adminbereich nur
Deutsch), Passwort zurücksetzen per E-Mail, E-Mail-Benachrichtigungen (neuer Auftrag, Angebot, Vergabe,
Storno, Beanstandung, Abschluss), Begrenzung von Anmelde-, Registrierungs- und Reset-Versuchen, Entwürfe
für Impressum, Datenschutzerklärung und Nutzungsbedingungen (vor dem Start rechtlich prüfen lassen und
die Platzhalter in eckigen Klammern ausfüllen).

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
- **E-Mails:** Ein Konto bei [Resend](https://resend.com) anlegen, die eigene Domain dort verifizieren und
  `RESEND_API_KEY` sowie `EMAIL_FROM` (z. B. `TaxiRoute <noreply@taxiroute.at>`) setzen. Ohne Schlüssel
  werden E-Mails nicht verschickt, sondern nur ins Server-Log geschrieben.
- **Links in E-Mails:** `APP_URL` auf die öffentliche Adresse setzen (z. B. `https://taxiroute.at`).
  Ohne `APP_URL` wird die Produktions-Domain von Vercel verwendet.

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
