"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { backgroundGeolocation, nativeHttp, nativePlatform } from "@/lib/native";

type Fix = { lat: number; lng: number; accuracy: number | null; speed: number | null; heading: number | null; at: number };

export type TrackerText = {
  sharing: string;
  waiting: string;
  lastSent: string;
  accuracy: string;
  offline: string;
  denied: string;
  unavailable: string;
  unsupported: string;
  keepOpen: string;
  /** Native App: Hinweis statt „Seite geöffnet lassen“ und Texte der Dauer-Mitteilung (Android) */
  background: string;
  backgroundTitle: string;
  backgroundMessage: string;
};

/** Alle 15 Sekunden die jeweils neueste Position senden; ohne Netz sammeln und später nachreichen. */
const SEND_EVERY_MS = 15_000;
const MAX_QUEUE = 100;

/**
 * Sendet Positionen an den Server. Android drosselt Anfragen aus der Web-Ansicht nach einigen Minuten
 * im Hintergrund, deshalb geht der Versand dort über die native Schicht der App.
 */
async function postPositions(batch: Fix[]): Promise<{ ok: boolean; status: number }> {
  if (nativePlatform() === "android") {
    const http = await nativeHttp();
    const res = await http.request({ url: new URL("/api/driver/positions", window.location.origin).href, method: "POST", headers: { "Content-Type": "application/json" }, data: batch });
    return { ok: res.status >= 200 && res.status < 300, status: res.status };
  }
  return fetch("/api/driver/positions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(batch), keepalive: true });
}

/**
 * Teilt während der Schicht den Standort mit dem eigenen Unternehmen. Im Browser läuft das, solange
 * die Seite geöffnet ist; der Bildschirm wird dafür (wo möglich) wach gehalten. In der nativen App
 * übernimmt die Hintergrund-Ortung: sie sendet auch bei gesperrtem Bildschirm weiter.
 */
export function ShiftTracker({ text }: { text: TrackerText }) {
  const router = useRouter();
  const latest = useRef<Fix | null>(null);
  const lastQueuedAt = useRef(0);
  const queue = useRef<Fix[]>([]);
  const [fix, setFix] = useState<Fix | null>(null);
  const [sentAt, setSentAt] = useState<Date | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [isNative, setIsNative] = useState(false);
  // Texte über eine Ref, damit ein Neuladen der Seite die Ortung nicht neu startet.
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    const native = nativePlatform() !== null;
    setIsNative(native);
    let lastFlush = 0;

    function onFix(f: Fix) {
      const first = !latest.current;
      latest.current = f;
      setFix(f);
      setProblem(null);
      // In der App ruft das System diese Funktion auch im Hintergrund auf, wo Zeitgeber pausieren können.
      if (first || (native && Date.now() - lastFlush >= SEND_EVERY_MS)) void flush();
    }

    let stopWatch = () => {};
    let cancelled = false;
    if (native) {
      void (async () => {
        const bg = await backgroundGeolocation();
        const id = await bg.addWatcher(
          { backgroundTitle: textRef.current.backgroundTitle, backgroundMessage: textRef.current.backgroundMessage, requestPermissions: true, stale: false, distanceFilter: 10 },
          (loc, err) => {
            if (err || !loc) {
              setProblem(err?.code === "NOT_AUTHORIZED" ? textRef.current.denied : textRef.current.unavailable);
              return;
            }
            onFix({
              lat: loc.latitude,
              lng: loc.longitude,
              accuracy: loc.accuracy ?? null,
              speed: loc.speed != null && loc.speed >= 0 ? loc.speed : null,
              heading: loc.bearing != null && loc.bearing >= 0 && loc.bearing <= 360 ? loc.bearing : null,
              at: loc.time ?? Date.now(),
            });
          },
        );
        if (cancelled) void bg.removeWatcher({ id });
        else stopWatch = () => void bg.removeWatcher({ id }).catch(() => {});
      })().catch(() => setProblem(textRef.current.unavailable));
    } else if (!("geolocation" in navigator)) {
      setProblem(textRef.current.unsupported);
      return;
    } else {
      const watch = navigator.geolocation.watchPosition(
        (p) =>
          onFix({
            lat: p.coords.latitude,
            lng: p.coords.longitude,
            accuracy: p.coords.accuracy ?? null,
            speed: p.coords.speed != null && p.coords.speed >= 0 ? p.coords.speed : null,
            heading: p.coords.heading != null && !Number.isNaN(p.coords.heading) ? p.coords.heading : null,
            at: p.timestamp || Date.now(),
          }),
        (err) => setProblem(err.code === err.PERMISSION_DENIED ? textRef.current.denied : textRef.current.unavailable),
        { enableHighAccuracy: true, maximumAge: 5_000, timeout: 30_000 },
      );
      stopWatch = () => navigator.geolocation.clearWatch(watch);
    }

    async function flush() {
      lastFlush = Date.now();
      const f = latest.current;
      if (f && f.at > lastQueuedAt.current) {
        queue.current = [...queue.current, f].slice(-MAX_QUEUE);
        lastQueuedAt.current = f.at;
      }
      if (queue.current.length === 0) return;
      const batch = queue.current;
      try {
        const res = await postPositions(batch);
        if (res.ok) {
          queue.current = queue.current.filter((x) => !batch.includes(x));
          setSentAt(new Date());
          setOffline(false);
        } else if (res.status === 409 || res.status === 401 || res.status === 403) {
          // Schicht wurde beendet oder Zugang geändert: Seite neu laden statt endlos zu senden.
          queue.current = [];
          router.refresh();
        } else {
          setOffline(true);
        }
      } catch {
        setOffline(true);
      }
    }

    const sender = setInterval(() => void flush(), SEND_EVERY_MS);
    // Neue Zuweisungen der Disposition erscheinen ohne Neuladen.
    const refresher = setInterval(() => router.refresh(), 60_000);

    let wakeLock: { release: () => Promise<void> } | null = null;
    async function keepAwake() {
      try {
        const wl = (navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock;
        if (wl && document.visibilityState === "visible") wakeLock = await wl.request("screen");
      } catch {
        // nicht unterstützt oder vom System abgelehnt
      }
    }
    function onVisible() {
      if (document.visibilityState === "visible") {
        if (!native) void keepAwake();
        void flush();
      }
    }
    // In der App läuft die Ortung im Hintergrund weiter, der Bildschirm darf ausgehen.
    if (!native) void keepAwake();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      stopWatch();
      clearInterval(sender);
      clearInterval(refresher);
      document.removeEventListener("visibilitychange", onVisible);
      void wakeLock?.release().catch(() => {});
    };
  }, [router]);

  const fmt = (d: Date) => d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className={`tracker ${problem ? "bad" : fix ? "ok" : "wait"}`} role="status" aria-live="polite">
      <span className="pulse" aria-hidden />
      <div>
        <strong>{problem ?? (fix ? text.sharing : text.waiting)}</strong>
        {!problem && (
          <small>
            {sentAt && <>{text.lastSent.replace("{time}", fmt(sentAt))}</>}
            {fix?.accuracy != null && <> · {text.accuracy.replace("{m}", String(Math.round(fix.accuracy)))}</>}
            {offline && <> · {text.offline}</>}
          </small>
        )}
        <small>{isNative ? text.background : text.keepOpen}</small>
      </div>
    </div>
  );
}
