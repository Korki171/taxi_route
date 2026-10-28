# TaxiRoute – Analyse, Architektur und Implementierungsplan

## Phase 1: Ist-Zustand (26.10.2026)

Das Repository `Korki171/taxi_route` war **leer** (kein Commit, keine Dateien). Es gab daher keine
bestehende Architektur, keine Datenmodelle und keine Sicherheitsrisiken aus Altbestand. TaxiRoute wird
neu aufgebaut.

## Gewählte Architektur

| Bereich | Entscheidung | Begründung |
|---|---|---|
| Sprache | TypeScript (strict) | Ein Typsystem für Server, UI und Datenmodell |
| Web-Framework | Next.js 15 (App Router, Server Components, Server Actions) | Serverseitiges Rendern, Berechtigungsprüfung auf dem Server, kein separates API-Projekt nötig |
| Datenbank | PostgreSQL 16 | Relational, Transaktionen und Sperren für „keine doppelte Auftragsannahme“ (Phase 3) |
| ORM / Migrationen | Prisma 6 | Typsichere Abfragen, versionierte Migrationen |
| Authentifizierung | Eigene DB-Sessions (httpOnly-Cookie, nur SHA-256 des Tokens in der DB), scrypt-Passworthashes | Keine Drittanbieter-Abhängigkeit, Sessions sofort widerrufbar (Sperre, Mitglied entfernt) |
| Validierung | zod | Jede Eingabe wird serverseitig geprüft |
| Tests | Vitest gegen echte PostgreSQL-Testdatenbank | Berechtigungen werden gegen echte Abfragen getestet, nicht gegen Mocks |

### Schichten

```
src/app/            Seiten und Server Actions (dünn: Formular -> Service -> Redirect)
src/server/authz/   Berechtigungsmodell (reine Funktionen) + Laden des Akteurs
src/server/services Fachlogik; JEDE Funktion bekommt den Akteur und prüft selbst
src/server/auth/    Passwörter, Tokens, Sessions
prisma/             Schema, Migrationen, Seed
tests/              Integrationstests inkl. organisationsübergreifender Zugriffe
```

Grundregel: **Die UI blendet nur aus, der Service entscheidet.** Jede Service-Funktion ruft
`requirePermission(actor, …)` auf und schränkt Datenbankabfragen auf `actor.org.id` ein. IDs fremder
Organisationen liefern „nicht gefunden“ statt „verboten“, damit keine Existenz verraten wird.

### Berechtigungsmodell

Eine Aktion ist erlaubt, wenn alle drei Bedingungen erfüllt sind:

1. **Rolle** des Nutzers in der Organisation erlaubt sie (OWNER, ADMIN, DISPATCHER, BOOKER, FINANCE, VIEWER).
2. **Geschäftsfunktion** der Organisation ist verifiziert, falls nötig:
   - `TRANSPORT_PROVIDER` – Fahrzeuge, Kapazitäten, Auftragsübernahme, Preisangebote
   - `TRANSFER_BOOKER` – Transfers anfragen und buchen
3. **Kontostatus** der Organisation: `ACTIVE`, `RESTRICTED` (nur Profilpflege) oder `SUSPENDED` (nur Lesen).

Der Organisationstyp (Taxiunternehmen / Reisebüro) bestimmt nur die Standard-Funktionen bei der
Registrierung, **nicht** die Rechte. Ein Reisebüro erhält nur `TRANSFER_BOOKER`; `TRANSPORT_PROVIDER`
muss es separat mit Konzession und Versicherung beantragen, und erst die Admin-Freigabe schaltet die
Funktion frei (Szenario D). Mischbetriebe werden so je Funktion getrennt geprüft.

Freigabe von `TRANSPORT_PROVIDER` ist serverseitig nur möglich mit geprüfter, nicht abgelaufener
Taxi- oder Mietwagenkonzession **und** geprüftem Versicherungsnachweis.

## Datenmodelle

**Umgesetzt in Phase 2:** `User`, `Session`, `Organization`, `OrganizationCapability`,
`TransportProfile`, `Membership`, `Invitation`, `VerificationDocument`, `AuditEvent`.

**Umgesetzt in Phase 3:** `Vehicle`, `TransferRequest` (Referenz `TR-000123`), `PassengerContact`
(getrennt gespeichert, nur für Beteiligte), `Quote` (ein Angebot je Unternehmen und Auftrag), `Booking`
(Leistungsumfang als unveränderlicher Snapshot), `TransferEvent` (Verlauf je Auftrag), `CapacityOffer`.
Orte kommen aus einem Katalog mit Koordinaten (`src/lib/places.ts`); Fahrzeit ≈ Luftlinie × 1,3 / 85 km/h.

Sichtbarkeit: Fremde Unternehmen sehen in der Börse keine Adressen, Abholhinweise, Fahrgastdaten,
Kundenreferenzen oder Kontaktdaten des Auftraggebers. Anbieter sehen nur ihr eigenes Angebot, auch im
Verlauf. Nach der Vergabe ist der Auftrag für alle Unbeteiligten nicht mehr auffindbar.

**Geplant für die nächsten Phasen** (Skizze, wird bei der Umsetzung verfeinert):

| Modell | Kernfelder | Phase |
|---|---|---|
| `Vehicle` | org, Kategorie, Sitzplätze, Gepäck, Ski, Kennzeichen, aktiv | 3 |
| `ServiceAuthorization` | org, Strecke/Region, Beförderungsart, Prüfstatus | 3 |
| `TransferRequest` | Auftraggeber-org, Ab-/Zielort (+Geo), Zeit + Zeitfenster, Pax, Gepäck, Ski, Kindersitze, Flugnr., Fahrzeugkategorie, Richtpreis, Preismodell (FIX/VERHANDELBAR), Angebotsfrist, Referenz, Sichtbarkeit (Börse/gezielt), Status | 3/4 |
| `TransferPassenger` | Request, Name, Telefon – nur für Auftraggeber und bestätigten Ausführer sichtbar | 4 |
| `QuoteInvitation` | Request, eingeladene org, Status | 4 |
| `Quote` | Request, Anbieter-org, Preis, Fahrzeugkategorie, Leistungsumfang, gültig bis, Status (ABGEGEBEN/ZURÜCKGEZOGEN/ANGENOMMEN/ABGELEHNT) | 3/4 |
| `Booking` | Request (unique!), Quote, Auftraggeber, Ausführer, endgültiger Preis, Leistungsumfang, Stornobedingungen, Buchungsreferenz, angenommen am, Status | 3/4 |
| `BookingEvent` | Booking, Typ, Akteur, Daten, Zeit – lückenloser Verlauf | 5 |
| `CapacityOffer` | org, Fahrzeug, Route, Zeitfenster, freie Plätze/Gepäck, max. Umweg/Wartezeit, Status (GEPLANT/BESTÄTIGT) | 3 |
| `PartnerRelation` | org → bevorzugte org, Typ | 5 |
| `Message` | Request/Booking, Absender-org, Text | 5 |
| `BillingRecord` | Booking, Betrag, Gebühr, Rechnungsreferenz, Zahlungsstatus (nur Dokumentation) | 4/5 |

Preiszustände werden getrennt modelliert: Richtpreis (`TransferRequest`), Angebot (`Quote`),
bestätigter Preis (`Booking`). Doppelte Annahme verhindert ein Unique-Constraint auf
`Booking.requestId` plus bedingtes Status-Update in einer Transaktion.

## Implementierungsplan

1. ✅ **Phase 1** – Analyse, Architektur (dieses Dokument)
2. ✅ **Phase 2** – Organisationen, Nutzer, Rollen, Auth, Profile, Verifizierung, Admin-Prüfung
3. ✅ **Phase 3** – Fahrzeuge, Transferaufträge in der Börse, Filter, Preisangebote, Übernahme (Szenario A), freie Kapazitäten/Rückfahrten mit Matching (Szenario C)
4. ✅ **Phase 4** – Reisebüro-Dashboard, gezielte Angebotsanfragen, Angebotsvergleich, Buchungsbestätigung, Referenzen, Buchungsbestätigung als PDF (Szenario B)
5. **Phase 5** – Statusmaschine, Buchungsereignisse, auftragsbezogene Nachrichten, E-Mail-Benachrichtigungen, Partnernetzwerk
6. **Phase 6** – End-to-End-Tests aller Szenarien, Sicherheitsprüfung, Rate-Limiting, Deployment

## Pilotbetrieb: Sprache, E-Mails, Missbrauchsschutz

**Mehrsprachigkeit.** Der deutsche Text ist der Schlüssel (`t("Anmelden")`), die englischen Texte stehen
in `src/lib/i18n-en.ts`. Serverkomponenten holen `t` und Formatierer (`f.dateTime`, `f.money` …) über
`getI18n()`. Die Sprache kommt aus dem Cookie `tr_lang` (gesetzt über `/lang/de|en`), sonst aus dem
Browser (Deutsch für deutschsprachige Browser, sonst Englisch). Fehlermeldungen der Services bleiben
deutsch und werden erst bei der Anzeige übersetzt. `tests/i18n.test.ts` stellt sicher, dass jeder Text
eine Übersetzung mit denselben Platzhaltern hat. Der Adminbereich und die Rechtstexte bleiben deutsch.
Eingaben der Nutzer (Notizen, Bedingungen) werden nicht übersetzt.

**E-Mails.** `src/server/email.ts` verschickt über Resend; ohne `RESEND_API_KEY` nur ins Log.
`src/server/notifications.ts` benachrichtigt nach dem Speichern: neue Aufträge an alle geprüften
Beförderungsunternehmen, Angebote an den Auftraggeber, Vergabe an beide Seiten, Storno/Beanstandung/
Abschluss an die andere Seite, zurückgezogene Aufträge an Anbieter mit Angebot. Die Sprache folgt dem
Land der Organisation. Mails enthalten keine Fahrgastdaten und keine genauen Adressen. Ein
Versandfehler lässt die Aktion nicht scheitern.

**Passwort zurücksetzen.** Einmal-Link (Token nur als Hash gespeichert, 1 Stunde gültig), danach werden
alle Sitzungen beendet. Die Antwort verrät nicht, ob eine Adresse registriert ist.

**Missbrauchsschutz.** Zähler in der Datenbank (`RateLimitHit`), damit die Grenze auch über mehrere
Vercel-Instanzen gilt: Anmeldung 10 Fehlversuche je E-Mail und 50 je IP in 15 Minuten, Registrierung
5 je IP pro Stunde, Reset-Mails 3 je Adresse pro Stunde.

**Datenbank bei Supabase.** Supabase macht das Schema `public` über seine Data API mit dem öffentlichen
Projektschlüssel erreichbar. Die Migration `supabase_lockdown` schaltet deshalb Row Level Security ohne
Policies auf allen Tabellen ein und entzieht den Rollen `anon` und `authenticated` alle Rechte, auch für
künftige Tabellen. Die App selbst greift nur serverseitig als Tabelleneigentümer zu und ist davon nicht
betroffen. Als `DATABASE_URL` den „Session pooler“ (Port 5432) verwenden.

## Live-Flottenkarte und Fahrer

**Rollen.** Neue Rolle `DRIVER` mit der Berechtigung `trips.drive` (setzt wie alle Beförderungsfunktionen
ein geprüftes `TRANSPORT_PROVIDER` voraus). Inhaber, Administratoren und Disponenten haben sie ebenfalls,
weil in kleinen Betrieben oft der Chef selbst fährt. Fahrer sehen nur `/fahrer`, keine Börse und keine Flotte.

**Disposition.** Unter `/flotte/live` weist der Disponent (`fleet.manage`) jeder Buchung Fahrer und
Fahrzeug zu (`Booking.driverId`, `Booking.vehicleId`). Darüber liegt die Live-Karte (Leaflet; Straßenkarte
als Vektorkarte von OpenFreeMap über MapLibre GL, kostenlos und ohne Schlüssel), die `/api/fleet/live` alle 10 Sekunden abfragt: Fahrer in offener Schicht,
letzte Position, Spur der letzten 30 Minuten und der aktuelle bzw. nächste Auftrag mit Ziel. Ohne neue
Position seit 2 Minuten gilt ein Fahrzeug als „kein Signal“. Eine Satellitenansicht gibt es bewusst nicht. Für das gewählte
Fahrzeug zeigt die Karte (dunkler OpenFreeMap-Stil) die Etappe: Start mit Schild, gefahrene Strecke blau, Restweg
violett gestrichelt bis zum Ziel, dazu eine Infotafel mit Start → Ziel, Restzeit, Ankunft und Fortschritt. Eine
Etappe beginnt beim Statuswechsel des Fahrers (`Booking.tripStageAt`): „Losfahren“ (vom GPS-Startpunkt zur Abholung)
bzw. „Fahrgast an Bord“ (Abholort → Ziel). Restweg und Zeit sind Schätzungen über Luftlinie × Straßenfaktor;
eine Straßenroute braucht später einen Routingdienst. Ziele liegen auf Ortsebene (Ortskatalog),
die genaue Adresse steht im Text.

**Fahrer-Ansicht.** `/fahrer` ist für das Handy gebaut und lässt sich über `manifest.webmanifest` auf den
Startbildschirm legen. Vor der ersten Schicht stimmt der Fahrer der Standortfreigabe zu
(`Membership.trackingConsentAt`). Während einer Schicht (`DriverShift`) schickt der Browser etwa alle
15 Sekunden die neueste Position an `/api/driver/positions` (ohne Netz gesammelt und nachgereicht) und
hält den Bildschirm über die Wake-Lock-API wach. Die Status-Knöpfe „Losfahren zur Abholung“, „Am
Abholort“, „Fahrgast an Bord“ und „Fahrt abgeschlossen“ setzen `Booking.tripStage`; der erste startet die
Buchung, der letzte schließt sie ab. „Am Abholort“ und „Fahrgast an Bord“ erscheinen auch im Verlauf
des Auftraggebers.

**Datenschutz.** Positionen werden nur in offener Schicht angenommen und nur dem eigenen Unternehmen
gezeigt. Beim Schichtende wird die letzte Position an der Schicht gelöscht, der Verlauf (`PositionPing`)
nach `POSITION_RETENTION_DAYS` (30 Tage). Die Kacheln kommen von den Servern von OpenFreeMap; das steht in der
Datenschutzerklärung.

**Grenze der Web-App.** Auf iPhones sendet der Browser nur, solange die Seite offen und im Vordergrund
ist. Für Hintergrund-Tracking braucht es später eine native App, die dieselbe API nutzt.

## Offene Fragen (Annahmen getroffen, reversibel)

- **E-Mail-Versand:** Noch kein Anbieter festgelegt. Einladungslinks werden einmalig in der UI angezeigt.
- **Dateispeicher:** Nachweise liegen im MVP in der Datenbank (max. 5 MB). Für Produktion: Objektspeicher (z. B. S3-kompatibel, EU-Region) mit signierten URLs.
- **Routen-/Geodaten:** Umweg und Wartezeit beim Rückfahrt-Matching werden aus Luftlinie × Straßenfaktor geschätzt und in der UI als Schätzung gekennzeichnet. Für Produktion ein Routingdienst (z. B. OpenRouteService oder Google Routes) und freie Adresseingabe statt Ortskatalog.
- **Verbindlichkeit bei Festpreis:** Die Übernahme zum Festpreis ist sofort verbindlich (wer zuerst bestätigt). Ein zusätzlicher Bestätigungsschritt des Auftraggebers wäre leicht ergänzbar.
- **Login-Schutz:** Rate-Limiting und Passwort-Zurücksetzen fehlen noch (Phase 6 bzw. mit E-Mail-Versand).
- **Rechtliches:** Vertragspartner, Zahlungsempfänger, Haftung und Umsatzsteuer müssen vor Produktivbetrieb geklärt werden. Bis dahin werden Preise und Gebühren nur dokumentiert, keine Zahlungen abgewickelt.
- **Hosting:** Noch offen; empfohlen EU-Hosting wegen DSGVO.


## Phase 4: Reisebüros (Szenario B)

**Gezielte Anfragen.** `TransferRequest.visibility` ist `MARKET` (ganze Börse) oder `INVITED` (nur eingeladene
Unternehmen). Einladungen stehen in `QuoteInvitation` (Status `PENDING` → `RESPONDED` beim Angebot bzw. der
Übernahme, oder `DECLINED` mit optionalem Grund). Sichtbarkeit regelt `VISIBLE_TO(orgId)` in
`src/server/services/visibility.ts`; Börsensuche, Detailansicht, Angebot, Festpreis-Übernahme und Rückfahrt-Matching
nutzen denselben Filter. Wer abgelehnt hat, sieht eine gezielte Anfrage nicht mehr. Der Auftraggeber kann weitere
Unternehmen anfragen (höchstens 20) oder die Anfrage später für die ganze Börse freigeben. Auch bei Börsenaufträgen
lassen sich Unternehmen zusätzlich direkt anfragen; sie erhalten eine eigene E-Mail und sehen den Auftrag unter
„Direktanfragen“. Eingeladen werden können nur aktive Organisationen mit geprüftem `TRANSPORT_PROVIDER`.

**Reisebüro-Dashboard.** Reine Auftraggeber (`transfers.request` ohne `jobs.accept`) sehen auf `/dashboard` ihre
Transfers der nächsten 14 Tage mit Stand, eine Suche nach Kundenreferenz, TR-Nummer oder Fahrgast, was Aufmerksamkeit
braucht (bald fällig und nicht vergeben, Frist ohne Angebot abgelaufen), Kennzahlen des Monats und die häufigsten
Partner mit Link zur gezielten Anfrage (`src/server/services/agency.ts`).

**Auftragsbestätigung als PDF.** `GET /api/bookings/{id}/confirmation` erzeugt mit pdf-lib (Standardschrift, keine
externen Dateien) eine A4-Bestätigung in der Sprache des Nutzers: beide Parteien, Leistung, Adressen, Fahrgast,
vereinbarter Preis, Bedingungen. Nur Auftraggeber und ausführendes Unternehmen erhalten sie, Fahrer nicht; die interne
Kundenreferenz steht nur im Exemplar des Auftraggebers.
