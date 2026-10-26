# TaxiRoute

B2B-Auftragsbörse für Taxi- und Transferunternehmen und Reisebüros (Start: Tirol ↔ Flughafen München).

Architektur, Datenmodell und Phasenplan: [docs/ARCHITEKTUR.md](docs/ARCHITEKTUR.md)

## Stand

Phase 2 ist umgesetzt: Registrierung von Taxiunternehmen und Reisebüros, Anmeldung, Mitarbeiter mit
Rollen und Einladungen, Unternehmensprofile, Nachweis-Upload, Verifizierung je Geschäftsfunktion durch
Plattformadmins, Sperren/Einschränken von Konten, Audit-Protokoll. Die Auftragsbörse (Phase 3) und die
Reisebüro-Buchungen (Phase 4) sind noch **nicht** umgesetzt.

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
