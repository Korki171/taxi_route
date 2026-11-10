"use client";

import { useId, useState, type CSSProperties, type ReactNode } from "react";

/**
 * „Durch die Stufen ziehen“: ein Regler schaltet den Satz links und den Zustand der Fahrtkarte rechts um.
 * Ohne Skript steht die erste Stufe da. Alle Stufen liegen im Dokument, nur die aktive ist sichtbar (Überblendung in home.css).
 */
export function Stages({ names, clauses, panels, label }: { names: string[]; clauses: string[]; panels: ReactNode[]; label: string }) {
  const [i, setI] = useState(0);
  const id = useId();
  const last = names.length - 1;
  return (
    <div className="hp-stages">
      <div className="hp-st-left" aria-live="polite">
        {clauses.map((c, k) => (
          <p key={k} className="hp-st-line" data-on={k === i} aria-hidden={k !== i}>{c}</p>
        ))}
      </div>
      <div className="hp-st-right">
        {panels.map((p, k) => (
          <div key={k} className="hp-st-panel" data-on={k === i} aria-hidden={k !== i}>{p}</div>
        ))}
      </div>
      <div className="hp-st-bar">
        <input
          id={id} type="range" min={0} max={last} step={1} value={i}
          onChange={(e) => setI(Number(e.target.value))}
          aria-label={label} aria-valuetext={names[i]}
          style={{ "--fill": `${(i / last) * 100}%` } as CSSProperties}
        />
        <ol>
          {names.map((n, k) => (
            <li key={k}><button type="button" data-on={k === i} aria-current={k === i} onClick={() => setI(k)}>{n}</button></li>
          ))}
        </ol>
      </div>
    </div>
  );
}
