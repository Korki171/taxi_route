# Transferborsa

**Transferborsa** ist eine B2B-Transferbörse für Taxi- und Transferunternehmen, Reisebüros, Hotels und
Reiseveranstalter. Unter dem Motto **„Abgeben. Übernehmen.“** stellen Betriebe Fahrten ein, die sie selbst
nicht fahren können, und andere übernehmen sie. Das vermeidet Leerfahrten und abgelehnte Anfragen.
Startregion ist Tirol ↔ Flughafen München, die App ist auf Deutsch und Englisch verfügbar.

Live: <https://www.transferborsa.com>

## Was die App kann

### Für Taxi- und Transferunternehmen
- **Auftragsbörse** (`/boerse`): Aufträge mit Filtern ansehen und zum Festpreis übernehmen oder ein
  Preisangebot abgeben. Ein Auftrag kann nie doppelt vergeben werden.
- **Aufträge abgeben:** Eigene Fahrten einstellen. Mit dem **Abgabe-Anteil** behält der Abgebende 0–15 %
  des Fahrpreises, die Plattform nimmt keine Provision.
- **Freie Rückfahrten** (`/flotte`): Fahrzeuge verwalten, freie Fahrten anbieten, passende Aufträge für
  Rückfahrten finden (Umweg und Wartezeit werden geschätzt).
- **Direktanfragen:** Reisebüros können gezielt bei einzelnen Betrieben anfragen, die annehmen oder ablehnen.
- **Live-Flottenkarte** (`/flotte/live`): Fahrer starten eine Schicht auf dem Handy (`/fahrer`, mit GPS),
  die Disposition sieht alle Fahrzeuge und Routen live auf einer Satellitenkarte.
- **Team:** Mitarbeiter mit Rollen (Inhaber, Admin, Disponent, Buchung, Finanzen, Lesezugriff) per Einladung.

### Für Reisebüros und Hotels
- **Dashboard:** eigene Aufträge, Angebote vergleichen und annehmen, gezielte Anfragen mit Status,
  freie Kapazitäten durchsuchen.
- **PDF-Auftragsbestätigung** (auf Deutsch oder Englisch) mit Referenz und bestätigtem Preis.

### Für alle
- Registrierung, Anmeldung, Passwort zurücksetzen, Unternehmensprofil, Nachweis-Upload.
- **Verifizierung:** Taxi-/Mietwagenkonzession und Versicherung werden von Plattformadmins geprüft,
  erst dann ist die Beförderungsfunktion frei. Admins können Konten einschränken oder sperren,
  alle Aktionen landen im Audit-Protokoll.
- E-Mail-Benachrichtigungen (neuer Auftrag, Angebot, Vergabe, Storno, Abschluss).
- Öffentliche Landing Page, Preisseite (`/preise`), Impressum, Datenschutz, Nutzungsbedingungen
  (Entwürfe mit Platzhaltern, vor dem Start rechtlich prüfen lassen).

### Preise
Taxi- und Transferunternehmen zahlen ein Abo (netto pro Monat), keine Provision pro Fahrt:
**Basis 39,99 €** (bis ca. 3 Fahrzeuge), **Pro 79,99 €** (bis ca. 10), **Flotte 179,99 €** (unbegrenzt,
Priorität). Reisebüros und Hotels nutzen die Plattform kostenlos. Die Preise stehen zentral in
`src/lib/plans.ts`. Ein Tarif und ein „kostenlos bis“-Datum werden im Adminbereich pro Unternehmen gesetzt.

## Tech-Stack

| Bereich | Technik |
|---|---|
| Sprache | TypeScript (strict) |
| Web-Framework | Next.js 15 (App Router, Server Components, Server Actions), React 19 |
| Datenbank | PostgreSQL (Supabase, EU) mit Prisma 6 (Schema und Migrationen) |
| Authentifizierung | Eigene DB-Sessions (httpOnly-Cookie, nur SHA-256 des Tokens in der DB), scrypt-Passworthashes |
| Validierung | zod |
| Karten | MapLibre GL / Leaflet mit OpenFreeMap, Satellitenbilder von basemap.at (Österreich) und Esri |
| PDF | pdf-lib |
| E-Mail | Resend |
| Schriften | Imbue und Albert Sans, selbst gehostet (`@fontsource-variable`) |
| Tests | Vitest gegen eine echte PostgreSQL-Testdatenbank |
| Hosting | Vercel |
| CI | GitHub Actions (Typprüfung, Tests, Build) |

## Projektstruktur

```
src/app/            Seiten und Server Actions (dünn: Formular → Service → Redirect)
  boerse/           Auftragsbörse, Auftragsdetails, neuer Auftrag
  flotte/           Fahrzeuge, freie Fahrten, Live-Karte
  fahrer/           Fahrer-Ansicht fürs Handy (Schicht, GPS)
  dashboard/        Übersicht (Taxibetrieb bzw. Reisebüro)
  organization/     Profil, Team, Nachweise
  admin/            Plattformverwaltung (Prüfung, Tarife, Sperren)
  preise/ login/ register/ …   öffentliche und Konto-Seiten
  api/              Dokument-Download, Buchungs-PDF, Live-Positionen
src/components/     UI-Bausteine, App-Rahmen, Landing Page (`landing/`)
src/server/
  authz/            Berechtigungsmodell (reine Funktionen) und Laden des Akteurs
  services/         Fachlogik (Börse, Matching, Agentur, Flotte, Disposition, Verifizierung …)
  auth/             Passwörter, Tokens, Sessions
  pdf/              PDF-Auftragsbestätigung
src/lib/            Hilfen: Preise (`plans.ts`), Abgabe-Anteil (`handoff.ts`), Übersetzung
                    (`i18n.ts`, `i18n-en.ts`), Orte, Formate, Datenbank-Client
prisma/             schema.prisma, Migrationen, Seed (`seed.ts`), Demodaten (`demo-boerse.ts`)
tests/              Integrationstests inkl. organisationsübergreifender Zugriffe
docs/               Architektur (ARCHITEKTUR.md), Bildnachweise
```

### Grundprinzipien
- **Die UI blendet nur aus, der Service entscheidet.** Jede Service-Funktion bekommt den Akteur und prüft
  Rechte selbst. Datenbankabfragen sind auf die eigene Organisation eingeschränkt, fremde IDs liefern
  „nicht gefunden“.
- **Berechtigung = Rolle × verifizierte Geschäftsfunktion × Kontostatus.** Funktionen sind
  `TRANSPORT_PROVIDER` (fahren, übernehmen, anbieten) und `TRANSFER_BOOKER` (Fahrten einstellen und buchen).
- **Keine Doppelvergabe:** Unique-Constraint auf der Buchung plus bedingtes Status-Update in einer Transaktion.
- **Preiszustände getrennt:** Richtpreis (Auftrag), Angebot, bestätigter Preis (Buchung).
- **Übersetzung:** Der deutsche Text ist der Schlüssel, Englisch steht in `src/lib/i18n-en.ts`. Neue
  UI-Texte mit `t()` umschließen und dort ergänzen (ein Test prüft die Abdeckung). Adminbereich und
  Rechtstexte bleiben deutsch.

Details und Datenmodell: [docs/ARCHITEKTUR.md](docs/ARCHITEKTUR.md)

## Lokal starten

Voraussetzungen: Node.js 20+ (CI nutzt 22), PostgreSQL 14+.

```bash
npm install
cp .env.example .env                 # DATABASE_URL anpassen
npx prisma migrate dev               # Datenbank anlegen
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='mind-12-zeichen' SEED_DEMO=1 npm run db:seed
npm run dev                          # http://localhost:3000
```

`SEED_DEMO=1` legt zusätzlich `taxi@demo.test` und `reise@demo.test` an (Passwort `demo-passwort-123`).
`npm run db:demo` füllt die Börse mit Beispielunternehmen, Aufträgen, Angeboten und Buchungen (nur lokal;
ersetzt vorhandene Demo-Unternehmen).

### Skripte

| Befehl | Zweck |
|---|---|
| `npm run dev` / `build` / `start` | Entwicklung, Produktions-Build, Start |
| `npm run lint` | Typprüfung (`tsc --noEmit`) |
| `npm test` | Tests gegen `.env.test` (Datenbank `taxiroute_test`) |
| `npm run db:migrate` / `db:deploy` | Migration erstellen / anwenden |
| `npm run db:seed` / `db:demo` | Plattformadmin bzw. Demodaten anlegen |

## Umgebungsvariablen

Es gehören keine Geheimnisse ins Repository. Lokal in `.env`, in Produktion in Vercel.

| Variable | Pflicht | Bedeutung |
|---|---|---|
| `DATABASE_URL` | ja (für die ganze App) | PostgreSQL-Verbindung. Bei Supabase die Pooler-Adresse nehmen, die Verbindungszahl ist begrenzt. |
| `RESEND_API_KEY` | optional | API-Schlüssel von Resend. Ohne Schlüssel werden E-Mails nur ins Server-Log geschrieben. |
| `EMAIL_FROM` | optional | Absender, z. B. `Transferborsa <noreply@transferborsa.com>` (Domain bei Resend verifizieren). |
| `APP_URL` | optional | Öffentliche Adresse für Links in E-Mails, z. B. `https://www.transferborsa.com`. Ohne Angabe wird die Vercel-Produktions-Domain verwendet. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | nur beim Seed | Zugangsdaten des Plattformadmins (Passwort mind. 12 Zeichen). |
| `SEED_DEMO` | nur beim Seed | `1` legt zusätzlich Demo-Konten an. |

## Tests

Die Tests laufen gegen eine eigene Datenbank (`.env.test`, Standard `taxiroute_test`), deren Tabellen
vor jedem Test geleert werden.

```bash
createdb taxiroute_test
npm test
```

## Deployment (Vercel)

Das Projekt ist für Vercel vorbereitet (`vercel-build`, `postinstall: prisma generate`).

1. Repository auf vercel.com/new importieren.
2. `DATABASE_URL` setzen. `vercel-build` führt vor dem Build `prisma migrate deploy` aus, wenn die Variable gesetzt ist.
   Ohne Datenbank läuft nur die Landing Page.
3. Plattformadmin einmalig mit `npm run db:seed` gegen die Produktionsdatenbank anlegen.
4. Für E-Mails `RESEND_API_KEY`, `EMAIL_FROM` und `APP_URL` setzen und die Domain bei Resend verifizieren.
5. Domain in Vercel hinzufügen (Apex leitet auf `www` um).

Jeder Push auf `main` wird automatisch deployt, Pull Requests bekommen eine Vorschau.

## Prüfablauf (Beförderungsfunktion)

1. Unternehmen lädt unter **Nachweise** Taxi-/Mietwagenkonzession und Versicherungsnachweis hoch.
2. Unter **Unternehmen** wird die Prüfung der Funktion „Beförderungsunternehmen“ beantragt.
3. Admin akzeptiert unter **Administration** die Dokumente und gibt die Funktion frei.

## Noch offen

Nachrichten zwischen Betrieben, Partnernetzwerk, Suchagent, Umkreissuche, Bewertungen und Ausschreibungen
(siehe Roadmap), Online-Zahlung (Stripe; bisher Rechnung), rechtlich geprüfte Texte und Firmendaten im
Impressum.
