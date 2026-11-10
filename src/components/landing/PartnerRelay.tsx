"use client";

import { useEffect, useRef, useState } from "react";
import { TaxiSign } from "./TaxiSign";

type Labels = { stages: [string, string, string]; route: string; when: string; price: string; open: string; taken: string; free: string; busy: string; summary: string };

/** Wie viele Schilder in der Börse stehen; die ersten drei sind die Partner. */
const SIGNS = 12;
const PARTNERS = 3;
/** Dieses Unternehmen übernimmt am Ende (kein Partner). */
const WINNER = 7;
const STEP_MS = 2200;

/**
 * Die Staffel neben der Treppe: dieselbe Fahrt wandert von den eigenen Fahrern zu den Partnern und dann in die ganze Börse,
 * bis ein Schild auf BESETZT springt. Läuft nur im Bild; bei reduzierter Bewegung steht das Endbild.
 * Für Screenreader gibt es einen Satz statt der Bilder.
 */
export function PartnerRelay({ L }: { L: Labels }) {
  const ref = useRef<HTMLDivElement>(null);
  // 0 eigene Fahrer, 1 Partner, 2 alle Geprüften, 3 übernommen
  const [phase, setPhase] = useState(3);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    const run = () => {
      window.clearInterval(timer);
      setPhase(0);
      timer = window.setInterval(() => setPhase((p) => (p + 1) % 4), STEP_MS);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) run();
      else window.clearInterval(timer);
    }, { threshold: 0.35 });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(timer);
    };
  }, []);

  const toneOf = (i: number): "free" | "busy" | "off" => {
    if (phase === 3) return i === WINNER ? "busy" : "off";
    if (phase === 2) return "free";
    if (phase === 1) return i < PARTNERS ? "free" : "off";
    return "off";
  };

  return (
    <figure className="hp-relay" ref={ref} data-phase={phase}>
      <p className="hp-sr">{L.summary}</p>
      <div aria-hidden="true">
        <ol className="hp-relay-steps">
          {L.stages.map((s, i) => (
            <li key={s} data-on={Math.min(phase, 2) === i}>
              <span>{i + 1}</span> {s}
            </li>
          ))}
        </ol>
        <div className="hp-relay-card" data-ui>
          <p className="hp-ride-chip" data-state={phase === 3 ? "taken" : "open"}>{phase === 3 ? L.taken : L.open}</p>
          <p className="hp-relay-route">{L.route}</p>
          <p className="hp-ride-meta">{L.when} · <b>{L.price}</b></p>
        </div>
        <ul className="hp-relay-board">
          {Array.from({ length: SIGNS }, (_, i) => (
            <li key={i} data-partner={i < PARTNERS}>
              <TaxiSign label={i === WINNER && phase === 3 ? L.busy : L.free} tone={toneOf(i)} size="s" />
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}
