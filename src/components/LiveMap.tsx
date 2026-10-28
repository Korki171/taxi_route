"use client";

import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";
import type * as Leaflet from "leaflet";
import { useEffect, useRef, useState } from "react";
import type { LiveLeg, LiveVehicle } from "@/server/services/dispatch";

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
  start: string;
  position: string;
  eta: string;
  arrival: string;
  estimate: string;
  driven: string;
  order: string;
  streets: string;
  satellite: string;
  legend: string;
  pickupPoint: string;
  dropoffPoint: string;
  route: string;
};

type State = "free" | "next" | "to-pickup" | "on-board" | "stale" | "none";

const POLL_MS = 10_000;
const STALE_MS = 120_000;
const TIROL: [number, number] = [47.3, 11.4];
// Dunkler Kartenstil von OpenFreeMap; falls er einmal fehlt, die helle Standardkarte.
const STYLE_DARK = "https://tiles.openfreemap.org/styles/dark";
const STYLE_FALLBACK = "https://tiles.openfreemap.org/styles/liberty";
const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services";
// Österreich: amtliches Orthofoto (CC BY 4.0), schärfer als Esri, aber erst nah herangezoomt
const BASEMAP_AT = "https://mapsneu.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857/{z}/{y}/{x}.jpeg";
const AUSTRIA: [[number, number], [number, number]] = [[46.35, 9.5], [49.05, 17.2]];
const BASEMAP_KEY = "tr_basemap";
const ROUTE = "#2f80ff";

type Basemap = "satellite" | "streets";

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

const duration = (min: number) => (min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")} min`);

/** Fahrtrichtung aus dem Kompass, sonst aus den letzten beiden Punkten der Spur. */
function headingOf(v: LiveVehicle) {
  if (v.heading != null) return v.heading;
  const [a, b] = v.trail.slice(-2);
  if (!a || !b || (a[0] === b[0] && a[1] === b[1])) return 0;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const [la, lb] = [(a[0] * Math.PI) / 180, (b[0] * Math.PI) / 180];
  const y = Math.sin(dLng) * Math.cos(lb);
  const x = Math.cos(la) * Math.sin(lb) - Math.sin(la) * Math.cos(lb) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Auto von vorn, weiß auf dem farbigen Fahrzeug-Knopf. */
const CAR_SVG =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#fff" d="M5 11.2 6.6 6.7A2.4 2.4 0 0 1 8.9 5h6.2a2.4 2.4 0 0 1 2.3 1.7l1.6 4.5c.6.4 1 1 1 1.8v4.3a.9.9 0 0 1-.9.9h-1.2a.9.9 0 0 1-.9-.9V16H7v1.3a.9.9 0 0 1-.9.9H4.9a.9.9 0 0 1-.9-.9V13c0-.8.4-1.4 1-1.8Zm2.1-.6h9.8l-1.1-3.3a.8.8 0 0 0-.8-.6H9a.8.8 0 0 0-.8.6Zm.4 4.2a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Zm9 0a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Z"/></svg>';

/** Rolle der Punkte einer Etappe: Startpunkt (GPS), Abholpunkt oder Zielpunkt. */
function legRoles(leg: LiveLeg): ["start" | "pickup", "pickup" | "dropoff"] {
  return leg.kind === "to-dropoff" || leg.kind === "waiting" ? ["pickup", "dropoff"] : ["start", "pickup"];
}

/** Beschriftung von Start und Ziel je nach Etappe. */
function legLabels(leg: LiveLeg, t: LiveText) {
  switch (leg.kind) {
    case "to-dropoff":
      return [t.pickup, t.dropoff];
    case "waiting":
      return [t.pickup, t.dropoff];
    case "to-pickup":
      return [t.start, t.pickup];
    default:
      return [t.position, t.pickup];
  }
}

/**
 * Live-Karte der eigenen Flotte über Leaflet: Satellitenbild mit kräftigen Farben (Esri, in Österreich
 * basemap.at) oder dunkle Straßenkarte von OpenFreeMap. Fragt das Lagebild alle 10 Sekunden neu ab und
 * zeigt je Fahrzeug, wo die Etappe begann, was schon gefahren ist und wohin es noch geht.
 */
export function LiveMap({ initial, text, locale }: { initial: LiveData; text: LiveText; locale: string }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const L = useRef<typeof Leaflet | null>(null);
  const layer = useRef<Leaflet.LayerGroup | null>(null);
  const fitted = useRef<string | null>(null);
  const [data, setData] = useState(initial);
  const [selected, setSelected] = useState<string | null>(() => pickDefault(initial.vehicles));
  const [now, setNow] = useState(() => Date.parse(initial.at));
  const [offline, setOffline] = useState(false);
  const [ready, setReady] = useState(false);
  // Nach Verschieben/Zoomen neu zeichnen, damit Schilder am rechten Rand nach links klappen
  const [view, setView] = useState(0);
  const [basemap, setBasemap] = useState<Basemap>("satellite");
  const bases = useRef<Record<Basemap, Leaflet.Layer> | null>(null);

  // Karte einmalig aufbauen (Leaflet braucht das Fenster, daher erst im Browser laden).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const mod = await import("leaflet");
      // Plugin hängt L.maplibreGL an Leaflet an (Vektorkarte über MapLibre GL).
      await import("@maplibre/maplibre-gl-leaflet");
      let style = STYLE_DARK;
      try {
        if (!(await fetch(STYLE_DARK)).ok) style = STYLE_FALLBACK;
      } catch {
        style = STYLE_FALLBACK;
      }
      if (cancelled || !el.current || map.current) return;
      L.current = mod;
      // Zoom-Knöpfe rechts, links oben liegt die Infotafel
      const m = mod.map(el.current, { zoomControl: false }).setView(TIROL, 9);
      mod.control.zoom({ position: "topright" }).addTo(m);
      m.on("moveend", () => setView((n) => n + 1));
      // Straßenkarte von OpenFreeMap: kostenlos, auch kommerziell, ohne Schlüssel und ohne Abrufgrenze.
      // Das Plugin erweitert das CommonJS-Objekt von Leaflet; je nach Bundling steckt es unter default.
      type WithGL = { maplibreGL?: (o: object) => Leaflet.Layer };
      const gl = ((mod as unknown as { default?: WithGL }).default?.maplibreGL ?? (window as unknown as { L?: WithGL }).L?.maplibreGL)!;
      const streets = gl({
        style,
        attribution: '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> Daten von <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      });
      // Satellit: Luftbild mit kräftigeren Farben (CSS-Filter am Pane), Relief darüber, Namen obenauf
      m.createPane("sat").className = "sat-pane";
      m.createPane("relief").className = "relief-pane";
      m.createPane("names").className = "names-pane";
      // Kacheln mit Herkunft anfragen: die Seite selbst sendet keinen Referer (Referrer-Policy: same-origin).
      const tiles = { maxZoom: 19, referrerPolicy: "strict-origin-when-cross-origin" } as const;
      const satellite = mod.layerGroup([
        // Auf Stufe 19 fehlen am Land oft Kacheln: dann Stufe 18 vergrößern
        mod.tileLayer(`${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`, { ...tiles, pane: "sat", maxNativeZoom: 18, attribution: "Esri, Maxar, Earthstar Geographics" }),
        mod.tileLayer(BASEMAP_AT, { ...tiles, pane: "sat", minZoom: 12, bounds: AUSTRIA, attribution: 'Luftbild Österreich: <a href="https://basemap.at" target="_blank">basemap.at</a>' }),
        mod.tileLayer(`${ESRI}/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}`, { ...tiles, pane: "relief", maxNativeZoom: 16 }),
        mod.tileLayer(`${ESRI}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`, { ...tiles, pane: "names" }),
        mod.tileLayer(`${ESRI}/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}`, { ...tiles, pane: "names", minZoom: 9, opacity: 0.55 }),
      ]);
      bases.current = { streets, satellite };
      let saved: string | null = null;
      try { saved = localStorage.getItem(BASEMAP_KEY); } catch { /* z. B. privater Modus */ }
      const first: Basemap = saved === "streets" ? "streets" : "satellite";
      bases.current[first].addTo(m);
      setBasemap(first);
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

  function switchBase(next: Basemap) {
    const m = map.current;
    const b = bases.current;
    if (!m || !b || next === basemap) return;
    m.removeLayer(b[basemap]);
    b[next].addTo(m);
    setBasemap(next);
    try { localStorage.setItem(BASEMAP_KEY, next); } catch { /* egal */ }
  }

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

  // Fahrzeuge, gefahrene Strecken, Restwege, Start und Ziel zeichnen.
  useEffect(() => {
    const mod = L.current;
    const m = map.current;
    const g = layer.current;
    if (!ready || !mod || !m || !g) return;
    g.clearLayers();
    const all: [number, number][] = [];
    let focus: [number, number][] = [];
    // Ausgewähltes Fahrzeug zuletzt, damit es oben liegt
    const ordered = [...data.vehicles].sort((a, b) => Number(a.shiftId === selected) - Number(b.shiftId === selected));
    for (const v of ordered) {
      if (v.lat == null || v.lng == null) continue;
      const st = stateOf(v, now);
      const isSel = selected === v.shiftId;
      const pos: [number, number] = [v.lat, v.lng];
      const leg = st === "stale" ? null : v.leg;
      all.push(pos);

      // Gefahrene Strecke: leuchtend blau, darunter ein breiter, weicher Schein
      if (v.trail.length > 1) {
        if (isSel) mod.polyline(v.trail, { color: ROUTE, weight: 12, opacity: 0.25, interactive: false }).addTo(g);
        mod.polyline(v.trail, { color: ROUTE, weight: isSel ? 5 : 3, opacity: isSel ? 1 : 0.6, lineCap: "round", lineJoin: "round", interactive: false }).addTo(g);
      }
      if (leg) {
        const end: [number, number] = [leg.end.lat, leg.end.lng];
        const start: [number, number] = [leg.start.lat, leg.start.lng];
        // Restweg (Luftlinie, daher gestrichelt)
        const from = leg.kind === "waiting" ? start : pos;
        if (isSel) mod.polyline([from, end], { color: ROUTE, weight: 12, opacity: 0.18, interactive: false }).addTo(g);
        mod.polyline([from, end], { color: isSel ? "#8fc0ff" : ROUTE, weight: isSel ? 4 : 2, opacity: isSel ? 1 : 0.45, dashArray: "1 9", lineCap: "round", interactive: false }).addTo(g);

        if (isSel) {
          const [startRole, endRole] = legRoles(leg);
          const right = m.getSize().x - 260;
          const pin = (role: string, at: [number, number], name: string, address: string | null) =>
            `<div class="rt-pin ${role}${m.latLngToContainerPoint(at).x > right ? " flip" : ""}"><span class="rt-mark"></span><span class="rt-card"><b>${esc(name)}</b>${address ? `<em>${esc(address)}</em>` : ""}</span></div>`;
          if (leg.kind !== "planned") {
            mod.marker(start, { icon: mod.divIcon({ className: "", html: pin(startRole, start, leg.start.name, leg.start.address), iconSize: [0, 0] }), interactive: false, zIndexOffset: 500 }).addTo(g);
          }
          mod.marker(end, { icon: mod.divIcon({ className: "", html: pin(endRole, end, leg.end.name, leg.end.address), iconSize: [0, 0] }), interactive: false, zIndexOffset: 500 }).addTo(g);
          // Restzeit und -strecke als Blase in der Mitte des Restwegs
          const mid: [number, number] = [(from[0] + end[0]) / 2, (from[1] + end[1]) / 2];
          mod.marker(mid, {
            icon: mod.divIcon({ className: "", html: `<div class="rt-eta">${CAR_SVG}<span><b>${duration(leg.etaMinutes)}</b>${Math.round(leg.remainingKm)} km</span></div>`, iconSize: [0, 0] }),
            interactive: false,
            zIndexOffset: 400,
          }).addTo(g);
          focus = [...v.trail, pos, start, end];
        }
      } else if (isSel) {
        focus = [...v.trail, pos];
      }

      const moving = leg && (leg.kind === "to-pickup" || leg.kind === "to-dropoff") && st !== "stale";
      const arrow = moving ? `<i class="car-dir" style="transform:rotate(${Math.round(headingOf(v))}deg)"></i>` : "";
      const icon = mod.divIcon({
        className: "",
        html: `<div class="car s-${st}${isSel ? " sel" : ""}">${arrow}<span class="car-badge">${CAR_SVG}</span><span class="car-name">${esc(v.vehicle ?? v.driver)}</span></div>`,
        iconSize: [0, 0],
      });
      mod.marker(pos, { icon, zIndexOffset: isSel ? 1000 : 0, title: v.driver })
        .on("click", () => setSelected(v.shiftId))
        .addTo(g);
    }
    // Beim ersten Mal bzw. bei neuer Auswahl die ganze Etappe einpassen
    const key = selected ?? "";
    if (fitted.current !== key) {
      const pts = focus.length > 1 ? focus : all;
      if (pts.length) {
        const wide = window.innerWidth > 720;
        m.fitBounds(pts, { paddingTopLeft: [wide ? 230 : 40, 70], paddingBottomRight: [wide ? 80 : 40, wide ? 250 : 50], maxZoom: 14 });
        fitted.current = key;
      }
    }
  }, [data, selected, now, ready, text, view]);

  const time = (iso: string | number) => new Date(iso).toLocaleTimeString(locale === "en" ? "en-GB" : "de-AT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Vienna" });
  const sorted = [...data.vehicles].sort((a, b) => a.driver.localeCompare(b.driver));
  const sel = data.vehicles.find((v) => v.shiftId === selected) ?? null;

  return (
    <div className="live">
      <div className="live-stage">
        <div className={`live-map base-${basemap}`} ref={el} />
        <div className="map-tools">
          <div className="base-switch" role="group">
            {(["streets", "satellite"] as const).map((b) => (
              <button key={b} type="button" aria-pressed={basemap === b} onClick={() => switchBase(b)}>{b === "streets" ? text.streets : text.satellite}</button>
            ))}
          </div>
          <ul className="map-key" aria-label={text.legend}>
            <li><i className="key-car s-free" />{text.free}</li>
            <li><i className="key-car s-next" />{text.nextTrip}</li>
            <li><i className="key-car s-to-pickup" />{text.toPickup}</li>
            <li><i className="key-car s-on-board" />{text.onBoard}</li>
            <li><i className="key-car s-stale" />{text.stale}</li>
            <li><i className="key-pin pickup" />{text.pickupPoint}</li>
            <li><i className="key-pin dropoff" />{text.dropoffPoint}</li>
            <li><i className="key-route" />{text.route}</li>
          </ul>
        </div>
        {sel && <RouteCard v={sel} now={now} text={text} time={time} />}
      </div>
      <aside className="live-list" aria-label={text.open}>
        <p className="muted live-meta">
          {offline ? text.offline : text.updated.replace("{time}", time(now))}
        </p>
        {sorted.length === 0 && <p className="empty">{text.noDrivers}</p>}
        {sorted.map((v) => {
          const st = stateOf(v, now);
          return (
            <div
              key={v.shiftId}
              role="button"
              tabIndex={0}
              aria-pressed={selected === v.shiftId}
              className={`live-item${selected === v.shiftId ? " sel" : ""}`}
              onClick={() => setSelected(v.shiftId)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(v.shiftId); } }}
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

/** Zuerst ein Fahrzeug, das gerade fährt, sonst eines mit anstehender Fahrt. */
function pickDefault(vehicles: LiveVehicle[]) {
  const by = (kinds: LiveLeg["kind"][]) => vehicles.find((v) => v.leg && kinds.includes(v.leg.kind));
  return (by(["to-dropoff", "to-pickup"]) ?? by(["waiting", "planned"]) ?? vehicles[0])?.shiftId ?? null;
}

/** Infotafel zur ausgewählten Fahrt: Start → Ziel, Restzeit und Fortschritt. */
function RouteCard({ v, now, text, time }: { v: LiveVehicle; now: number; text: LiveText; time: (t: string | number) => string }) {
  const st = stateOf(v, now);
  const leg = v.leg;
  const [startLabel, endLabel] = leg ? legLabels(leg, text) : ["", ""];
  const moving = leg && (leg.kind === "to-pickup" || leg.kind === "to-dropoff");
  return (
    <section className="route-card" aria-live="polite">
      <header>
        <span className={`dot s-${st}`} aria-hidden />
        <span>
          <strong>{v.driver}</strong>{v.vehicle && <span className="rc-muted"> · {v.vehicle}{v.plate ? ` · ${v.plate}` : ""}</span>}
          <span className={`rc-state s-${st}`}>{stageText(v, text)}{st === "stale" ? ` · ${text.stale}` : ""}</span>
        </span>
      </header>
      {leg && (
        <>
          <ol className="rc-stops">
            <li className={legRoles(leg)[0]}><i aria-hidden /><span><small>{startLabel}</small>{leg.start.name}{leg.start.address && <em>{leg.start.address}</em>}</span></li>
            <li className={legRoles(leg)[1]}><i aria-hidden /><span><small>{endLabel}</small>{leg.end.name}{leg.end.address && <em>{leg.end.address}</em>}</span></li>
          </ol>
          <div className="rc-time">
            <p className="rc-eta">{text.eta.replace("{d}", duration(leg.etaMinutes)).replace("{km}", String(Math.round(leg.remainingKm)))}</p>
            <p className="rc-sub">
              {text.arrival.replace("{time}", time(now + leg.etaMinutes * 60_000))}
              {moving && leg.drivenKm > 0 ? <><br />{text.driven.replace("{km}", String(leg.drivenKm))}</> : null}
              <br />{text.estimate}
            </p>
          </div>
          {moving && (
            <div className="rc-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={leg.progress}>
              <span className="rc-fill" style={{ width: `${leg.progress}%` }} />
              <span className="rc-knob" style={{ left: `${leg.progress}%` }}><b>{leg.progress}&nbsp;%</b></span>
            </div>
          )}
        </>
      )}
      {v.trip && (
        <p className="rc-order">
          <a href={`/boerse/auftrag/${v.trip.requestId}`}>{text.order.replace("{ref}", v.trip.ref)}</a>
          <span className="rc-muted"> · {text.pickupAt.replace("{time}", time(v.trip.pickupAt))} · {text.persons.replace("{n}", String(v.trip.passengers))}</span>
        </p>
      )}
    </section>
  );
}
