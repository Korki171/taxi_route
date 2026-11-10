"use client";

import { useEffect, useRef } from "react";

// Tirol hinter dem Footer: Himmel mit Mond (Nacht, dunkler Modus) oder Sonne (Tag, heller Modus), vier Bergketten
// (in der Mitte das Tal, wo der Text steht), Nebel zwischen den Ketten, vorne eine Straße. Ein Taxi mit gelbem Dachschild fährt ab und zu durch.
// Himmel, Berge und Straße werden je Größe und Modus einmal in eigene Leinwände gemalt; pro Bild kommen nur Nebel und Taxi dazu.
// Der Modus kommt aus data-theme der umgebenden .hp und wechselt mit dem Umschalter.
// Läuft nur, solange der Footer sichtbar ist. Bei reduzierter Bewegung steht das Taxi still in der Mitte.

const TAXI = "#f5c518";

type Palette = {
  night: boolean;
  sky: [string, string];
  /** Mond- oder Sonnenscheibe und ihr Schein */
  orb: string; halo: string;
  /** Bergketten von hinten nach vorne: [Grat, Fuß] */
  ridges: [string, string][];
  snow: [string, string]; rim: string;
  road: string; roadLine: string; dash: string; ground: string;
  mist: [number, number, number]; mistAlpha: [number, number];
  car: string; carRim: string; glass: string; beam: string;
};

const NIGHT: Palette = {
  night: true,
  sky: ["#0a0b0e", "#1a1b20"],
  orb: "#e9e7dc", halo: "232,230,218",
  ridges: [["#2c2e33", "#1d1e22"], ["#222327", "#18191c"], ["#1a1b1e", "#141416"], ["#141415", "#0f0f0f"]],
  snow: ["rgba(226,229,236,0.16)", "rgba(226,229,236,0.09)"], rim: "235,236,240",
  road: "#0b0b0c", roadLine: "rgba(230,230,230,0.10)", dash: "rgba(230,230,230,0.16)", ground: "#0f0f0f",
  mist: [150, 154, 164], mistAlpha: [0.5, 0.35],
  car: "#050505", carRim: "rgba(255,255,255,0.14)", glass: "#1c1d21", beam: "255,244,214",
};

const DAY: Palette = {
  night: false,
  sky: ["#cfdbe6", "#f1eee6"],
  orb: "#fff6d8", halo: "255,236,170",
  ridges: [["#b8c1cb", "#c9d0d6"], ["#9eaab4", "#b4bcc2"], ["#8a968e", "#a3ab9f"], ["#6f7a68", "#f6f5f1"]],
  snow: ["rgba(255,255,255,0.75)", "rgba(255,255,255,0.5)"], rim: "255,255,255",
  road: "#3a3b3d", roadLine: "rgba(255,255,255,0.35)", dash: "rgba(255,255,255,0.8)", ground: "#f6f5f1",
  mist: [255, 255, 255], mistAlpha: [0.55, 0.4],
  car: "#161616", carRim: "rgba(255,255,255,0.25)", glass: "#5b6670", beam: "255,250,230",
};
const DRIVE_MS = 15000;
const PAUSE_MS = 5000;

/** mulberry32: kleine, feste Zufallsfolge, damit die Berge bei jedem Besuch gleich aussehen. */
function rng(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 1D-Wertrauschen, 0–1. */
function noise1(seed: number) {
  const r = rng(seed);
  const lat = new Float32Array(512).map(() => r());
  return (x: number) => {
    const i = Math.floor(x);
    const f = x - i;
    const s = f * f * (3 - 2 * f);
    const a = lat[i & 511];
    return a + (lat[(i + 1) & 511] - a) * s;
  };
}

/** Gratlinie aus „ridged noise“: spitze Gipfel statt runder Hügel. 0–1. */
function ridgeHeight(n: (x: number) => number, x: number) {
  let sum = 0;
  let norm = 0;
  for (let o = 0, amp = 1, f = 1; o < 5; o++, amp *= 0.5, f *= 2.1) {
    sum += amp * (1 - Math.abs(2 * n(x * f + o * 31.7) - 1));
    norm += amp;
  }
  return Math.pow(sum / norm, 1.5);
}

type Scene = {
  W: number; H: number; dpr: number; roadY: number; roadH: number;
  sky: HTMLCanvasElement; ridges: HTMLCanvasElement[]; road: HTMLCanvasElement; mist: HTMLCanvasElement;
  mistY: number[]; P: Palette;
};

const MX = 24; // Überstand links und rechts für die Parallaxe

function layer(w: number, h: number, dpr: number) {
  const c = document.createElement("canvas");
  c.width = Math.ceil(w * dpr);
  c.height = Math.ceil(h * dpr);
  const g = c.getContext("2d")!;
  g.scale(dpr, dpr);
  return { c, g };
}

function buildScene(W: number, H: number, dpr: number, P: Palette): Scene {
  const roadH = Math.max(30, H * 0.055);
  const roadY = H - roadH - Math.max(24, H * 0.04);

  // Himmel, Sterne (nur nachts), Mond oder Sonne
  const sky = layer(W, H, dpr);
  const grad = sky.g.createLinearGradient(0, 0, 0, H * 0.75);
  grad.addColorStop(0, P.sky[0]);
  grad.addColorStop(1, P.sky[1]);
  sky.g.fillStyle = grad;
  sky.g.fillRect(0, 0, W, H);
  const r = rng(7);
  const stars = P.night ? Math.round((W * H) / 4200) : 0;
  for (let i = 0; i < stars; i++) {
    const x = r() * W;
    const y = Math.pow(r(), 1.5) * H * 0.62;
    const s = 0.5 + r() * r() * 1.3;
    sky.g.fillStyle = `rgba(236,238,245,${0.18 + r() * 0.55})`;
    sky.g.fillRect(x, y, s, s);
  }
  const mr = Math.max(13, Math.min(24, W * 0.017));
  // Auf schmalen Schirmen in die Ecke, damit der Mond nicht in der Überschrift steht
  const narrow = W < 760;
  const mx = narrow ? W - mr * 2.4 : W * 0.82;
  const my = narrow ? mr * 2.4 : H * 0.15;
  const halo = sky.g.createRadialGradient(mx, my, 0, mx, my, mr * 9);
  halo.addColorStop(0, `rgba(${P.halo},${P.night ? 0.16 : 0.55})`);
  halo.addColorStop(1, `rgba(${P.halo},0)`);
  sky.g.fillStyle = halo;
  sky.g.fillRect(0, 0, W, H);
  sky.g.fillStyle = P.orb;
  sky.g.beginPath();
  sky.g.arc(mx, my, mr, 0, Math.PI * 2);
  sky.g.fill();
  sky.g.fillStyle = "rgba(160,158,148,0.28)";
  if (P.night) for (const [dx, dy, cr] of [[-0.3, -0.25, 0.26], [0.32, 0.12, 0.18], [-0.05, 0.4, 0.14]]) {
    sky.g.beginPath();
    sky.g.arc(mx + dx * mr, my + dy * mr, cr * mr, 0, Math.PI * 2);
    sky.g.fill();
  }

  // Bergketten: in der Mitte flacher (das Tal), außen höher
  const ridges = P.ridges.map(([top, foot], i) => {
    const L = layer(W + MX * 2, H, dpr);
    const n = noise1(101 + i * 37);
    const base = H * (0.6 + i * 0.075);
    const amp = H * (0.3 - i * 0.05);
    const wave = 300 - i * 45;
    const crest: number[] = [];
    for (let x = -MX; x <= W + MX; x += 2) {
      const u = Math.min(1, Math.abs(x - W / 2) / (W / 2));
      const valley = 0.4 + 0.6 * u * u * (3 - 2 * u);
      crest.push(base - amp * valley * ridgeHeight(n, (x - W / 2) / wave + 500));
    }
    const pathAlong = (g: CanvasRenderingContext2D) => crest.forEach((y, k) => (k ? g.lineTo(k * 2, y) : g.moveTo(0, y)));
    const top0 = Math.min(...crest);
    const fill = L.g.createLinearGradient(0, top0, 0, Math.min(H, base + H * 0.12));
    fill.addColorStop(0, top);
    fill.addColorStop(1, foot);
    L.g.fillStyle = fill;
    L.g.beginPath();
    pathAlong(L.g);
    L.g.lineTo(W + MX * 2, H);
    L.g.lineTo(0, H);
    L.g.closePath();
    L.g.fill();
    // Schnee auf den hohen Gipfeln der hinteren Ketten
    if (i < 2) {
      const snowLine = base - amp * 0.55;
      L.g.fillStyle = P.snow[i];
      L.g.beginPath();
      pathAlong(L.g);
      for (let k = crest.length - 1; k >= 0; k--) L.g.lineTo(k * 2, crest[k] + Math.max(0, snowLine - crest[k]) * 0.45);
      L.g.closePath();
      L.g.fill();
    }
    L.g.strokeStyle = `rgba(${P.rim},${(P.night ? 0.07 : 0.35) - i * (P.night ? 0.015 : 0.08)})`;
    L.g.lineWidth = 1;
    L.g.beginPath();
    pathAlong(L.g);
    L.g.stroke();
    return L.c;
  });

  // Straße und Boden davor
  const road = layer(W, H - roadY + 8, dpr);
  const y0 = 8;
  road.g.fillStyle = P.road;
  road.g.fillRect(0, y0, W, roadH);
  road.g.fillStyle = P.roadLine;
  road.g.fillRect(0, y0, W, 1);
  road.g.fillRect(0, y0 + roadH - 1, W, 1);
  road.g.fillStyle = P.dash;
  for (let x = -((W / 2) % 44); x < W; x += 44) road.g.fillRect(x, y0 + roadH / 2 - 1, 20, 2);
  road.g.fillStyle = P.ground;
  road.g.fillRect(0, y0 + roadH, W, H);

  // Nebelband, waagrecht kachelbar
  const mist = layer(512, 64, 1);
  const nm = noise1(909);
  const img = mist.g.createImageData(512, 64);
  for (let y = 0; y < 64; y++) {
    const bell = Math.exp(-Math.pow((y / 64 - 0.5) / 0.22, 2));
    for (let x = 0; x < 512; x++) {
      const v = 0.6 * nm((x / 512) * 12 + y * 0.05) + 0.4 * nm((x / 512) * 24 + 77 + y * 0.09);
      const k = (y * 512 + x) * 4;
      [img.data[k], img.data[k + 1], img.data[k + 2]] = P.mist;
      img.data[k + 3] = Math.max(0, Math.min(1, (v - 0.35) * 2.4)) * bell * 255;
    }
  }
  mist.g.putImageData(img, 0, 0);

  return { W, H, dpr, roadY, roadH, sky: sky.c, ridges, road: road.c, mist: mist.c, mistY: [H * 0.68, H * 0.78], P };
}

/** Das Taxi von der Seite, Front nach rechts. x = linke Kante, b = Unterkante der Räder. */
function drawTaxi(g: CanvasRenderingContext2D, x: number, b: number, L: number, roadY: number, roadH: number, P: Palette) {
  const r = L * 0.1;
  // Lichtkegel und Lichtfleck auf der Straße
  const beam = g.createLinearGradient(x + L, 0, x + L * 3.2, 0);
  beam.addColorStop(0, `rgba(${P.beam},${P.night ? 0.22 : 0.3})`);
  beam.addColorStop(1, `rgba(${P.beam},0)`);
  g.fillStyle = beam;
  g.beginPath();
  g.moveTo(x + L, b - L * 0.2);
  g.lineTo(x + L * 3.2, b - L * 0.34);
  g.lineTo(x + L * 3.2, roadY + roadH);
  g.lineTo(x + L, b - L * 0.12);
  g.fill();
  const glow = g.createRadialGradient(x + L * 0.5, b - L * 0.47, 0, x + L * 0.5, b - L * 0.47, L * 0.75);
  glow.addColorStop(0, "rgba(245,197,24,0.28)");
  glow.addColorStop(1, "rgba(245,197,24,0)");
  g.fillStyle = glow;
  g.fillRect(x - L * 0.3, b - L * 1.3, L * 1.6, L * 1.4);

  // Karosserie
  g.fillStyle = P.car;
  g.beginPath();
  g.moveTo(x + L * 0.02, b - r);
  g.lineTo(x + L * 0.02, b - L * 0.25);
  g.quadraticCurveTo(x + L * 0.04, b - L * 0.3, x + L * 0.2, b - L * 0.31);
  g.lineTo(x + L * 0.3, b - L * 0.44);
  g.lineTo(x + L * 0.66, b - L * 0.44);
  g.lineTo(x + L * 0.8, b - L * 0.31);
  g.quadraticCurveTo(x + L * 0.98, b - L * 0.29, x + L, b - L * 0.2);
  g.lineTo(x + L, b - r);
  g.closePath();
  g.fill();
  g.strokeStyle = P.carRim;
  g.lineWidth = 1;
  g.stroke();
  // Fenster
  g.fillStyle = P.glass;
  g.beginPath();
  g.moveTo(x + L * 0.25, b - L * 0.31);
  g.lineTo(x + L * 0.32, b - L * 0.405);
  g.lineTo(x + L * 0.64, b - L * 0.405);
  g.lineTo(x + L * 0.75, b - L * 0.31);
  g.closePath();
  g.fill();
  // Räder
  for (const wx of [0.22, 0.78]) {
    g.fillStyle = "#000";
    g.beginPath();
    g.arc(x + L * wx, b - r, r, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#26272b";
    g.beginPath();
    g.arc(x + L * wx, b - r, r * 0.45, 0, Math.PI * 2);
    g.fill();
  }
  // Scheinwerfer und Rücklicht
  g.fillStyle = "#fff4d6";
  g.fillRect(x + L * 0.965, b - L * 0.23, L * 0.035, L * 0.04);
  g.fillStyle = "#d92b21";
  g.fillRect(x + L * 0.02, b - L * 0.24, L * 0.03, L * 0.045);

  // Dachschild
  const sw = L * 0.26;
  const sh = L * 0.085;
  const sx = x + L * 0.48 - sw / 2;
  const sy = b - L * 0.44 - sh - L * 0.012;
  g.save();
  g.shadowColor = "rgba(245,197,24,0.9)";
  g.shadowBlur = L * 0.22;
  g.fillStyle = TAXI;
  g.beginPath();
  g.roundRect(sx, sy, sw, sh, [sh * 0.6, sh * 0.6, sh * 0.15, sh * 0.15]);
  g.fill();
  g.restore();
  g.fillStyle = "#111";
  g.font = `700 ${Math.round(sh * 0.78)}px "Albert Sans Variable", system-ui, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("TAXI", sx + sw / 2, sy + sh * 0.56);
}

export function NightRoad() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const box = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !box || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let scene: Scene | null = null;
    let raf = 0;
    let visible = false;
    let px = 0;
    let tx = 0;
    const t0 = performance.now();

    const draw = (now: number) => {
      const s = scene;
      if (!s) return;
      const { W, H, dpr } = s;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.drawImage(s.sky, 0, 0, W, H);
      const t = reduced ? 0 : now - t0;
      s.ridges.forEach((c, i) => {
        ctx.drawImage(c, -MX - px * (2 + i * 4), 0, W + MX * 2, H);
        if (i === 1 || i === 2) {
          const bw = W * 1.6;
          const bh = H * (i === 1 ? 0.2 : 0.14);
          const off = ((t * (i === 1 ? 0.006 : 0.01)) % bw);
          ctx.globalAlpha = s.P.mistAlpha[i - 1];
          ctx.drawImage(s.mist, -off, s.mistY[i - 1] - bh / 2, bw, bh);
          ctx.drawImage(s.mist, bw - off, s.mistY[i - 1] - bh / 2, bw, bh);
          ctx.globalAlpha = 1;
        }
      });
      ctx.drawImage(s.road, 0, s.roadY - 8, W, H - s.roadY + 8);
      const L = Math.max(72, Math.min(116, W * 0.075));
      const b = s.roadY + s.roadH * 0.72;
      if (reduced) {
        drawTaxi(ctx, W * 0.56, b, L, s.roadY, s.roadH, s.P);
      } else {
        const cycle = t % (DRIVE_MS + PAUSE_MS);
        if (cycle < DRIVE_MS) {
          const p = cycle / DRIVE_MS;
          drawTaxi(ctx, -L * 3.4 + (W + L * 4.6) * p, b, L, s.roadY, s.roadH, s.P);
        }
      }
    };

    const tick = (now: number) => {
      raf = 0;
      px += (tx - px) * 0.06;
      draw(now);
      if (visible && !reduced) raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!raf && visible) raf = requestAnimationFrame(tick);
    };

    const resize = () => {
      const W = Math.max(1, box.clientWidth);
      const H = Math.max(1, box.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      scene = buildScene(W, H, dpr, box.closest<HTMLElement>(".hp")?.dataset.theme === "dark" ? NIGHT : DAY);
      draw(performance.now());
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || reduced) return;
      const rect = box.getBoundingClientRect();
      tx = Math.max(-0.5, Math.min(0.5, (e.clientX - rect.left) / rect.width - 0.5));
      wake();
    };

    resize();
    document.fonts?.ready.then(() => draw(performance.now()));
    const ro = new ResizeObserver(resize);
    ro.observe(box);
    // Umschalter hell/dunkel: Szene neu malen
    const hp = box.closest(".hp");
    const mo = new MutationObserver(resize);
    if (hp) mo.observe(hp, { attributes: true, attributeFilter: ["data-theme"] });
    const io = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      if (visible) wake();
    });
    io.observe(box);
    box.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      io.disconnect();
      box.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={ref} className="mf-canvas" aria-hidden="true" />;
}
