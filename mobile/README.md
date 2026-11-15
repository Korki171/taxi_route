# Transferborsa Fahrer-App (iOS und Android)

Die App ist eine native Hülle (Capacitor) um die Web-App. Sie lädt `https://www.transferborsa.com/fahrer`
und ergänzt, was der Browser nicht kann:

- **Hintergrund-GPS während der Schicht:** Die Position wird auch bei gesperrtem Bildschirm gesendet
  (Plugin `@capacitor-community/background-geolocation`). Nur während der Schicht, mit Einwilligung des
  Fahrers wie bisher; auf Android zeigt eine Dauer-Mitteilung „Schicht läuft“.
- **Push-Mitteilungen** über Firebase Cloud Messaging (Plugin `@capacitor-firebase/messaging`): neue Aufträge
  für Disponenten, zugewiesene Fahrten für Fahrer. Ein Tipp öffnet die passende Seite.

Die Logik liegt vollständig in der Web-App (`src/lib/native.ts`, `ShiftTracker`, `NativeApp`, `PushToggle`).
Änderungen an der Oberfläche brauchen deshalb kein App-Update. Die Ordner `android/` und `ios/` werden auf
dem Rechner erzeugt und sind nicht eingecheckt.

> Stand: Der Web-Teil ist getestet. Die nativen Projekte wurden noch auf keinem Gerät gebaut, weil dafür die
> Konten unten und ein Mac mit Xcode bzw. Android Studio nötig sind. Der erste Bau ist der eigentliche Test.

## Einmalig: Konten

1. **Firebase-Projekt** (kostenlos) unter https://console.firebase.google.com anlegen, darin eine Android-App
   und eine iOS-App mit der Kennung `com.transferborsa.app` registrieren.
   - `google-services.json` herunterladen (Android), `GoogleService-Info.plist` herunterladen (iOS).
   - Projekteinstellungen → Dienstkonten → „Neuen privaten Schlüssel generieren“. Den Inhalt der JSON-Datei in
     Vercel als Umgebungsvariable `FIREBASE_SERVICE_ACCOUNT` (Production, sensibel) hinterlegen. Erst damit
     verschickt der Server Mitteilungen an die App.
2. **Apple Developer Program** (99 $ im Jahr): nötig für Push und für TestFlight/App Store. Im Apple-Konto
   einen APNs-Schlüssel (.p8) erzeugen und in Firebase unter Cloud Messaging → Apple-App hochladen.
3. **Google Play Console** (25 $ einmalig) für die Veröffentlichung auf Android.

## Projekt erzeugen

```sh
cd mobile
npm install
npx cap add android
npx cap add ios        # nur auf einem Mac
```

### Android (`android/`)

- `google-services.json` nach `android/app/` kopieren.
- In `android/app/src/main/AndroidManifest.xml` innerhalb von `<manifest>` ergänzen:

  ```xml
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
  <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
  <uses-feature android:name="android.hardware.location.gps" />
  ```

- Optional in `android/app/src/main/res/values/strings.xml` den Namen des Kanals der Dauer-Mitteilung setzen:
  `<string name="capacitor_background_geolocation_notification_channel_name">Schicht</string>`

### iOS (`ios/`)

- `GoogleService-Info.plist` in Xcode zum App-Ziel hinzufügen.
- In Xcode unter „Signing & Capabilities“: **Push Notifications** und **Background Modes** mit
  „Location updates“ und „Remote notifications“ einschalten.
- In `ios/App/App/Info.plist` ergänzen:

  ```xml
  <key>NSLocationWhenInUseUsageDescription</key>
  <string>Während der Schicht sieht Ihre Disposition, wo Sie gerade sind.</string>
  <key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
  <string>Während der Schicht wird Ihr Standort auch bei gesperrtem Bildschirm mit Ihrer Disposition geteilt. Nach Schichtende nicht mehr.</string>
  ```

- Die Einrichtung von Firebase in `AppDelegate.swift` steht in der Anleitung des Plugins:
  https://github.com/capawesome-team/capacitor-firebase/tree/main/packages/messaging

## Bauen und testen

```sh
npx cap sync
npx cap open android   # Android Studio: auf dem Handy starten
npx cap open ios       # Xcode: auf dem iPhone starten
```

Gegen eine Vorschau statt der Live-Seite testen: `APP_URL=https://… npx cap sync`.

Prüfliste auf dem Gerät:

1. Anmelden als Fahrer, Schicht starten, Standort „Immer“ bzw. „Beim Verwenden der App“ erlauben.
2. Bildschirm sperren und 10 Minuten fahren oder gehen: Auf der Live-Karte der Disposition wandert das Fahrzeug weiter.
3. Mitteilungen einschalten, dann als Disponent dem Fahrer eine Fahrt zuweisen: Die Mitteilung kommt an, ein Tipp öffnet „Meine Fahrten“.
4. Als Disponent anmelden und von einem zweiten Betrieb einen Festpreis-Auftrag einstellen: Mitteilung kommt, Tipp öffnet den Auftrag.
5. Schicht beenden: Die Dauer-Mitteilung verschwindet, es wird nichts mehr gesendet.

## Hinweise für die Stores

- Apple und Google verlangen eine Begründung für Standort im Hintergrund. Text: „Der Standort wird nur während
  einer vom Fahrer gestarteten Schicht an den eigenen Betrieb übertragen, damit die Disposition Fahrten zuweisen kann.“
- Datenschutzerklärung und Impressum mit echten Firmendaten müssen vorher online sein.
- In Österreich ist die Ortung von Beschäftigten eine Kontrollmaßnahme: Betriebe brauchen die Zustimmung der
  Fahrer (in der App vor der ersten Schicht) und gegebenenfalls eine Betriebsvereinbarung.
