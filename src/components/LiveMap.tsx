"use client";

import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import { useEffect, useRef, useState } from "react";
import type { LiveVehicle } from "@/server/services/dispatch";

export type LiveData = { vehicles: LiveVehicle[]; unassigned: number; at: string };

export type LiveText = {
  free: string;
  toPickup: string;
  atPickup: string;
  onBoard: string;
  nextTrip: string;
  stale: string;
  noPosition: string;
  ago: string;
  pickupAt: string;
  persons: string;
  pickup: string;
  dropoff: string;
  noDrivers: string;
  open: string;
  updated: string;
  offline: string;
};

type State = "free" | "next" | "to-pickup" | "on-board" | "stale" | "none";

const POLL_MS = 10_000;
const STALE_MS = 120_000;
const TIROL: [number, number] = [47.3, 11.4];

function stateOf(v: LiveVehicle, now: number): State {
  if (!v.positionAt) return "none";
  if (now - Date.parse(v.positionAt) > STALE_MS) return "stale";
  if (!v.trip) return "free";
  if (v.trip.stage === "ON_BOARD") return "on-board";
  if (v.trip.stage === "TO_PICKUP" || v.trip.stage === "AT_PICKUP") return "to-pickup";
  return "next";
}

function stageText(v: LiveVehicle, t: LiveText) {
  if (!v.trip) return t.free;
  if (v.trip.stage === "ON_BOARD") return t.onBoard;
  if (v.trip.stage === "AT_PICKUP") return t.atPickup;
  if (v.trip.stage === "TO_PICKUP") return t.toPickup;
  return t.nextTrip;
}

function ago(iso: string, now: number, t: LiveText) {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  return t.ago.replace("{n}", s < 90 ? `${s} s` : `${Math.round(s / 60)} min`);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Ziel, auf das der Fahrer gerade zufährt: erst Abholort, mit Fahrgast an Bord das Ziel. */
function target(v: LiveVehicle) {
  if (!v.trip) return null;
  return v.trip.stage === "ON_BOARD" ? v.trip.dropoff : v.trip.pickup;
}

/**
 * Live-Karte der eigenen Flotte (OpenStreetMap über Leaflet). Fragt das Lagebild alle
 * 10 Sekunden neu ab und zeichnet Fahrzeuge, Spuren und die aktuellen Ziele.
 */
export function LiveMap({ initial, text, locale }: { initial: LiveData; text: LiveText; locale: string }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const L = useRef<typeof Leaflet | null>(null);
  const layer = useRef<Leaflet.LayerGroup | null>(null);
  const fitted = useRef(false);
  const [data, setData] = useState(initial);
  const [selected, setSelected] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.parse(initial.at));
  const [offline, setOffline] = useState(false);
  const [ready, setReady] = useState(false);

  // Karte einmalig aufbauen (Leaflet braucht das Fenster, daher erst im Browser laden).
  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((mod) => {
      if (cancelled || !el.current || map.current) return;
      L.current = mod;
      const m = mod.map(el.current, { zoomControl: true }).setView(TIROL, 9);
      mod.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(m);
      layer.current = mod.layerGroup().addTo(m);
      map.current = m;
      setReady(true);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Lagebild regelmäßig neu laden.
  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch("/api/fleet/live", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        setData(await res.json());
        setOffline(false);
      } catch {
        setOffline(true);
      }
      setNow(Date.now());
    }
    const id = setInterval(poll, POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 5_000);
    return () => {
      clearInterval(id);
      clearInterval(tick);
    };
  }, []);

  // Fahrzeuge, Spuren und Ziele zeichnen.
  useEffect(() => {
    const mod = L.current;
    const m = map.current;
    const g = layer.current;
    if (!ready || !mod || !m || !g) return;
    g.clearLayers();
    const bounds: [number, number][] = [];
    for (const v of data.vehicles) {
      if (v.lat == null || v.lng == null) continue;
      const st = stateOf(v, now);
      const isSel = selected === v.shiftId;
      const pos: [number, number] = [v.lat, v.lng];
      bounds.push(pos);
      if (v.trail.length > 1) {
        mod.polyline(v.trail, { color: isSel ? "#0b5cad" : "#5b6676", weight: isSel ? 4 : 2, opacity: isSel ? 0.8 : 0.4 }).addTo(g);
      }
      const goal = target(v);
      if (goal && st !== "stale") {
        mod.polyline([pos, [goal.lat, goal.lng]], { color: "#0b5cad", weight: 2, dashArray: "6 6", opacity: isSel ? 0.9 : 0.35 }).addTo(g);
        if (isSel) {
          mod.circleMarker([goal.lat, goal.lng], { radius: 8, color: "#0b5cad", weight: 3, fillColor: "#fff", fillOpacity: 1 })
            .bindTooltip(`${goal === v.trip?.pickup ? text.pickup : text.dropoff}: ${esc(goal.address || goal.name)}`, { direction: "top" })
            .addTo(g);
          bounds.push([goal.lat, goal.lng]);
        }
      }
      const label = esc(v.vehicle ?? v.driver);
      const icon = mod.divIcon({
        className: "",
        html: `<div class="car-pin s-${st}${isSel ? " sel" : ""}">${v.heading != null && st !== "stale" ? `<i style="transform:rotate(${Math.round(v.heading)}deg)"></i>` : ""}<span>${label}</span></div>`,
        iconSize: [0, 0],
      });
      mod.marker(pos, { icon, zIndexOffset: isSel ? 1000 : 0, title: v.driver })
        .on("click", () => setSelected(v.shiftId))
        .addTo(g);
    }
    if (!fitted.current && bounds.length) {
      m.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      fitted.current = true;
    }
  }, [data, selected, now, ready, text]);

  function focus(v: LiveVehicle) {
    setSelected(v.shiftId);
    if (v.lat != null && v.lng != null) map.current?.setView([v.lat, v.lng], Math.max(map.current.getZoom(), 12));
  }

  const time = (iso: string) => new Date(iso).toLocaleTimeString(locale === "en" ? "en-GB" : "de-AT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Vienna" });
  const sorted = [...data.vehicles].sort((a, b) => a.driver.localeCompare(b.driver));

  return (
    <div className="live">
      <div className="live-map" ref={el} />
      <aside className="live-list" aria-label={text.open}>
        <p className="muted live-meta">
          {offline ? text.offline : text.updated.replace("{time}", time(new Date(now).toISOString()))}
        </p>
        {sorted.length === 0 && <p className="empty">{text.noDrivers}</p>}
        {sorted.map((v) => {
          const st = stateOf(v, now);
          return (
            <div
              key={v.shiftId}
              role="button"
              tabIndex={0}
              className={`live-item${selected === v.shiftId ? " sel" : ""}`}
              onClick={() => focus(v)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); focus(v); } }}
            >
              <span className={`dot s-${st}`} aria-hidden />
              <span className="live-body">
                <span><strong>{v.driver}</strong>{v.vehicle && <span className="muted"> · {v.vehicle}</span>}</span>
                <span className="live-line">{stageText(v, text)}{v.speed != null && st !== "stale" && v.speed > 1 ? ` · ${Math.round(v.speed * 3.6)} km/h` : ""}</span>
                {v.trip && (
                  <span className="live-line">
                    <a href={`/boerse/auftrag/${v.trip.requestId}`} onClick={(e) => e.stopPropagation()}>{v.trip.ref}</a>{" "}
                    {v.trip.pickup.name} → {v.trip.dropoff.name}
                    <br />
                    <span className="muted">{text.pickupAt.replace("{time}", time(v.trip.pickupAt))} · {text.persons.replace("{n}", String(v.trip.passengers))}</span>
                  </span>
                )}
                <span className="live-line muted">
                  {st === "none" ? text.noPosition : st === "stale" ? `${text.stale} · ${ago(v.positionAt!, now, text)}` : ago(v.positionAt!, now, text)}
                </span>
              </span>
            </div>
          );
        })}
      </aside>
    </div>
  );
}
