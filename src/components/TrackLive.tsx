"use client";

import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";
import type Leaflet from "leaflet";
import { useEffect, useRef, useState } from "react";
import type { TrackView } from "@/server/services/tracking";

export type TrackText = {
  /** Überschrift je Zustand */
  state: Record<string, string>;
  eta: string; // "noch etwa {n} min"
  updated: string; // "Stand {time}"
  noPosition: string;
  pickup: string;
  dropoff: string;
  vehicle: string;
};

const STYLE = "https://tiles.openfreemap.org/styles/liberty";
const POLL_MS = 15_000;

export function stateKey(v: Pick<TrackView, "status" | "stage">) {
  return v.status === "IN_PROGRESS" ? (v.stage ?? "IN_PROGRESS") : v.status;
}

/** Karte und Fortschritt für den Live-Status-Link. Lädt den Stand alle 15 Sekunden neu. */
export function TrackLive({ token, initial, text, locale }: { token: string; initial: TrackView; text: TrackText; locale: string }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const L = useRef<typeof Leaflet | null>(null);
  const layer = useRef<Leaflet.LayerGroup | null>(null);
  const [v, setV] = useState(initial);
  const [ready, setReady] = useState(false);
  const live = v.status === "CONFIRMED" || v.status === "IN_PROGRESS";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const mod = await import("leaflet");
      await import("@maplibre/maplibre-gl-leaflet");
      if (cancelled || !el.current || map.current) return;
      L.current = mod;
      const m = mod.map(el.current, { zoomControl: false, attributionControl: true });
      type WithGL = { maplibreGL?: (o: object) => Leaflet.Layer };
      const gl = ((mod as unknown as { default?: WithGL }).default?.maplibreGL ?? (window as unknown as { L?: WithGL }).L?.maplibreGL)!;
      gl({
        style: STYLE,
        attribution: '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      }).addTo(m);
      layer.current = mod.layerGroup().addTo(m);
      map.current = m;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/track/${token}`, { cache: "no-store" });
        if (res.ok) setV(await res.json());
      } catch { /* nächster Versuch in 15 Sekunden */ }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [token, live]);

  useEffect(() => {
    const m = map.current, lf = L.current, g = layer.current;
    if (!ready || !m || !lf || !g) return;
    g.clearLayers();
    const a: [number, number] = [v.pickup.lat, v.pickup.lng];
    const b: [number, number] = [v.dropoff.lat, v.dropoff.lng];
    lf.polyline([a, b], { color: "#111", weight: 3, dashArray: "6 8", opacity: 0.7 }).addTo(g);
    lf.circleMarker(a, { radius: 7, color: "#111", weight: 3, fillColor: "#fff", fillOpacity: 1 }).bindTooltip(`${text.pickup}: ${v.pickup.name}`).addTo(g);
    lf.circleMarker(b, { radius: 7, color: "#111", weight: 3, fillColor: "#111", fillOpacity: 1 }).bindTooltip(`${text.dropoff}: ${v.dropoff.name}`).addTo(g);
    const pts: [number, number][] = [a, b];
    if (v.position) {
      const p: [number, number] = [v.position.lat, v.position.lng];
      lf.circleMarker(p, { radius: 11, color: "#111", weight: 3, fillColor: "#f5c518", fillOpacity: 1 }).bindTooltip(text.vehicle).addTo(g);
      pts.push(p);
    }
    m.fitBounds(lf.latLngBounds(pts), { padding: [36, 36], maxZoom: 13 });
  }, [ready, v, text]);

  const time = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-AT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Vienna" });
  return (
    <>
      <div className="track-state" role="status" aria-live="polite">
        <strong>{text.state[stateKey(v)] ?? v.status}</strong>
        {v.etaMinutes != null && <span>{text.eta.replace("{n}", String(v.etaMinutes))}</span>}
        {v.status === "IN_PROGRESS" && !v.position && <span className="muted">{text.noPosition}</span>}
        {v.position && <small className="muted">{text.updated.replace("{time}", time.format(new Date(v.position.at)))}</small>}
      </div>
      <div ref={el} className="track-map" />
    </>
  );
}
