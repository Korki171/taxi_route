"use client";

import { useEffect } from "react";
import { messaging, nativePlatform, saveNativeToken } from "@/lib/native";

/**
 * Läuft nur in der nativen App: hält das Geräte-Token aktuell und öffnet beim Tipp auf eine
 * Mitteilung die passende Seite. Im Browser macht die Komponente nichts.
 */
export function NativeApp() {
  useEffect(() => {
    if (!nativePlatform()) return;
    let stop = false;
    const listeners: { remove: () => Promise<void> }[] = [];
    (async () => {
      const m = await messaging();
      listeners.push(
        await m.addListener("notificationActionPerformed", (e) => {
          const url = e.notification?.data?.url;
          if (url && url.startsWith("/")) window.location.assign(url);
        }),
        await m.addListener("tokenReceived", (e) => void saveNativeToken(e.token).catch(() => {})),
      );
      if (stop) return;
      // Nach neuer Anmeldung kennt der Server das Gerät evtl. nicht mehr (ohne Anmeldung antwortet er mit 401).
      if ((await m.checkPermissions()).receive === "granted") await saveNativeToken((await m.getToken()).token);
    })().catch(() => {});
    return () => {
      stop = true;
      for (const l of listeners) void l.remove().catch(() => {});
    };
  }, []);
  return null;
}
