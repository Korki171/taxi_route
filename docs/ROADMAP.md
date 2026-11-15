# Roadmap

Stand: 15. November 2026. Diese Datei sagt, was als Nächstes gebaut wird und warum. Wer am Code arbeitet
(Mensch oder Agent), liest sie vor größeren Änderungen. Was schon fertig ist, steht im README und in
`docs/ARCHITEKTUR.md`.

## Leitlinie für den Pilot (Winter 2026/27)

Die Börse muss für einen Betrieb **leichter sein als die WhatsApp-Gruppe** und **ab dem ersten Tag Nutzen
bringen**, auch wenn noch wenig los ist. Ob sie funktioniert, entscheidet sich an wenigen Zahlen auf einer
Strecke (Flughafen München/Innsbruck ↔ ein bis zwei Täler):

| Messgröße | Ziel im Pilot |
|---|---|
| Eingestellte Aufträge pro Woche | mehr als 20 in der Saison |
| Übernahmequote | mehr als 60 % |
| Zeit bis zur Übernahme (Median) | unter 2 Stunden |
| Betriebe, die nach der Gratisphase zahlen | mindestens die Hälfte |

Neue Funktionen nur, wenn sie eine dieser Zahlen verbessern. Die App bleibt so einfach wie möglich:
Optionales kommt hinter „Weitere Angaben“, und Funktionen werden versteckt oder zusammengelegt, nicht gelöscht.

## Als Nächstes: Nutzung und Attraktivität (in dieser Reihenfolge)

1. **Aufträge in WhatsApp teilen.** Jeder Auftrag bekommt einen Teilen-Link (WhatsApp, Kopieren). Wer den Link
   öffnet, sieht die Fahrt ohne Login (ohne Fahrgastdaten) und kann nach einer kurzen Registrierung übernehmen.
   Ziel: WhatsApp-Gruppen bringen neue Betriebe auf die Börse, statt ihr Konkurrenz zu machen.
2. **Übernahme in Minuten.** *Gebaut (November 2026):* Mitteilung aufs Handy bei jedem neuen Auftrag (Web-Push,
   E-Mail als Rückfall) mit direktem „Übernehmen“ bei Festpreis. Bleibt ein Auftrag 30 Minuten frei (Standardfrist),
   wird automatisch die nächste Stufe im Partnernetzwerk benachrichtigt; ein Zeitgeber prüft alle 5 Minuten
   (`.github/workflows/weitergabe.yml`). Offen: nativer Push über die Fahrer-App, SMS/WhatsApp nur bei Bedarf.
3. **Einstieg in 2 Minuten.** Registrierung von 14 auf etwa 6 Pflichtfelder, Konzession und Versicherung
   später nachreichen. Navigation für Taxibetriebe von 8 auf 4 Punkte.
4. **Hotels bestellen ohne Konto.** Einfaches Bestellformular bzw. ein fester Link pro Hotel/Reisebüro, ohne
   Login. Der Auftrag landet in der Börse, die Bestätigung geht per E-Mail mit PDF.
5. **Nutzen auch ohne volle Börse.** Fahrer-App, Live-Karte und PDF-Bestätigungen im Onboarding und auf der
   Startseite nach vorne stellen („deine Disposition, dazu die Börse“), damit sich das Abo auch in ruhigen
   Wochen lohnt.
6. **Vertrauen und Fairness.** Klare Kundenschutz-Regel (wer übernimmt, wirbt den Endkunden nicht ab) in
   Nutzungsbedingungen und Auftragsansicht, kurze Bewertung nach der Fahrt, Abzeichen „Konzession geprüft“
   gut sichtbar.
7. **Preis ohne Risiko.** Garantie „kein übernommener oder vermittelter Auftrag im Monat, dann ist der Monat
   gratis“, Saisonpause (Mai, Juni, November) und Jahresabo mit Rabatt. Die Gratismonate für Pilotbetriebe
   bleiben, dazu kommt bei der Freischaltung eine Zahlungszusage ab Ende der Gratisphase. Preise bleiben zentral
   in `src/lib/plans.ts`.

## Fahrer-App (native, iOS und Android)

Die Fahrer-Ansicht `/fahrer` läuft heute als Web-App (PWA). Sie sendet die Position auf dem iPhone nur, solange
die Seite offen ist. Geplant ist eine native App für iOS und Android, voraussichtlich mit Capacitor als Hülle
um die bestehende Web-App:

- **Gleiche API:** Schicht, Fahrten, Statusknöpfe und Positionen über die vorhandenen Endpunkte
  (`/api/driver/positions` usw.), keine zweite Logik.
- **Hintergrund-GPS** während der Schicht, mit Einwilligung der Fahrer (DSGVO, in Österreich ist Tracking eine
  Kontrollmaßnahme). Nur während der Schicht, Aufbewahrung wie heute 30 Tage.
- **Push-Benachrichtigungen** für Fahrer und Disponenten: neue passende Aufträge in der Börse, Übernahme,
  Chat-Nachrichten, Statusänderungen. Das ist die Grundlage für Punkt 2 oben.
- **Später:** Navigation per Übergabe an Google Maps/Apple Karten, Reisebüros sehen das ankommende Fahrzeug.

**Stand November 2026:** Der Web-Teil ist gebaut: Hintergrund-Ortung und nativer Push sind in der Web-App
vorbereitet (`src/lib/native.ts`), der Server verschickt über Firebase Cloud Messaging, und das Capacitor-Projekt
liegt unter `mobile/` (Anleitung in `mobile/README.md`). Offen: Firebase-Projekt, Apple-Developer- und
Google-Play-Konto, erster Bau und Test auf echten Geräten, Einreichung in den Stores.

## Abgleich mit TIMOCOM (Stand 15. November 2026)

Gebaut sind: Bewertungen nach der Fahrt, Live-Status-Link für Auftraggeber und Fahrgast, Umkreissuche und Karte
in der Börse, bis zu 5 gespeicherte Strecken mit Benachrichtigung, Ablaufwarnung für Nachweise, Strecken- und
Preisrichtwert beim Einstellen, Firmenverzeichnis, mehrere Standorte pro Betrieb, Storno- und No-Show-Regeln,
Ausschreibungen für Saison- und Gruppentransfers, Auswertung (`/statistik`) und Zwei-Faktor-Anmeldung per
E-Mail-Code.

Bewusst nicht gebaut: KI-Assistent (verworfen), Schnittstelle zu Dispo-Software, Inkasso und Bonitätsauskunft.

**Danach:** keine neuen Funktionen, sondern Oberfläche. Die Fahrer-App soll schön und übersichtlich sein, und
Taxibetriebe sollen in der Web-App so wenig wie möglich ausfüllen müssen (siehe Punkt 3 oben).

## Später (nach dem Pilot, wenn die Zahlen stimmen)

- Online-Zahlung (Stripe; bisher Rechnung)
- Straßen-Routing statt Luftlinie (z. B. OpenRouteService)
- Weitere Regionen: Salzburg/Pinzgau, Bayern, Südtirol, Schweiz

## Vor zahlenden Kunden erledigen (kein Code)

Gewerbeanmeldung, Impressum und Datenschutz mit echten Firmendaten, rechtliche Kurzprüfung bei der WKO Tirol
(Vermittlung ohne eigene Konzession, Abgabe-Anteil bei Tariffahrten), Markenprüfung „Transferborsa“.
