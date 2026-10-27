"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
};

/** Alle 15 Sekunden die jeweils neueste Position senden; ohne Netz sammeln und später nachreichen. */
const SEND_EVERY_MS = 15_000;
const MAX_QUEUE = 100;

/**
 * Teilt während der Schicht den Standort mit dem eigenen Unternehmen. Läuft im Browser, solange
 * die Seite geöffnet ist; der Bildschirm wird dafür (wo möglich) wach gehalten.
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
  // Texte über eine Ref, damit ein Neuladen der Seite die Ortung nicht neu startet.
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setProblem(textRef.current.unsupported);
      return;
    }
    const watch = navigator.geolocation.watchPosition(
      (p) => {
        const f: Fix = {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy ?? null,
          speed: p.coords.speed != null && p.coords.speed >= 0 ? p.coords.speed : null,
          heading: p.coords.heading != null && !Number.isNaN(p.coords.heading) ? p.coords.heading : null,
          at: p.timestamp || Date.now(),
        };
        const first = !latest.current;
        latest.current = f;
        setFix(f);
        setProblem(null);
        if (first) void flush();
      },
      (err) => setProblem(err.code === err.PERMISSION_DENIED ? textRef.current.denied : textRef.current.unavailable),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 30_000 },
    );

    async function flush() {
      const f = latest.current;
      if (f && f.at > lastQueuedAt.current) {
        queue.current = [...queue.current, f].slice(-MAX_QUEUE);
        lastQueuedAt.current = f.at;
      }
      if (queue.current.length === 0) return;
      const batch = queue.current;
      try {
        const res = await fetch("/api/driver/positions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batch),
          keepalive: true,
        });
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
        void keepAwake();
        void flush();
      }
    }
    void keepAwake();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      navigator.geolocation.clearWatch(watch);
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
        <small>{text.keepOpen}</small>
      </div>
    </div>
  );
}
