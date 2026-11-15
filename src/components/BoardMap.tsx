"use client";

import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";
import type Leaflet from "leaflet";
import { useEffect, useRef } from "react";

export type BoardMapPoint = { id: string; name: string; lat: number; lng: number; jobs: { href: string; label: string; note: string }[] };

const STYLE = "https://tiles.openfreemap.org/styles/liberty";
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Karte der offenen Aufträge in der Börse: ein Punkt je Abholort mit der Anzahl, Antippen zeigt die Fahrten. */
export function BoardMap({ points, label }: { points: BoardMapPoint[]; label: string }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let m: Leaflet.Map | null = null;
    void (async () => {
      const L = await import("leaflet");
      await import("@maplibre/maplibre-gl-leaflet");
      if (cancelled || !el.current) return;
      m = L.map(el.current, { scrollWheelZoom: false });
      type WithGL = { maplibreGL?: (o: object) => Leaflet.Layer };
      const gl = ((L as unknown as { default?: WithGL }).default?.maplibreGL ?? (window as unknown as { L?: WithGL }).L?.maplibreGL)!;
      gl({
        style: STYLE,
        attribution: '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      }).addTo(m);
      for (const p of points) {
        const icon = L.divIcon({ className: "", html: `<span class="board-pin">${p.jobs.length}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] });
        const list = p.jobs.map((j) => `<li><a href="${esc(j.href)}">${esc(j.label)}</a><small>${esc(j.note)}</small></li>`).join("");
        L.marker([p.lat, p.lng], { icon, title: `${p.name}: ${p.jobs.length}`, keyboard: true })
          .bindPopup(`<strong>${esc(p.name)}</strong><ul class="board-pop">${list}</ul>`, { maxWidth: 280 })
          .addTo(m);
      }
      if (points.length) m.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])), { padding: [40, 40], maxZoom: 11 });
      else m.setView([47.3, 11.4], 8);
    })();
    return () => {
      cancelled = true;
      m?.remove();
    };
  }, [points]);

  return <div ref={el} className="board-map" role="region" aria-label={label} />;
}
