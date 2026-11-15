import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Die App ist eine Hülle um die Web-App: sie lädt die Seite vom Server (immer aktuell, kein
 * App-Update für Änderungen an der Oberfläche nötig) und ergänzt Hintergrund-GPS und Push.
 * Für Tests gegen eine andere Adresse: APP_URL=https://… npx cap sync
 */
const appUrl = (process.env.APP_URL ?? "https://www.transferborsa.com").replace(/\/$/, "");

const config: CapacitorConfig = {
  appId: "com.transferborsa.app",
  appName: "Transferborsa",
  webDir: "www",
  server: {
    url: `${appUrl}/fahrer`,
    allowNavigation: [new URL(appUrl).hostname],
  },
  android: {
    // Hintergrund-Ortung: ohne diese Einstellung drosselt Android die Web-Ansicht nach 5 Minuten im Hintergrund.
    useLegacyBridge: true,
  },
  plugins: {
    FirebaseMessaging: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
