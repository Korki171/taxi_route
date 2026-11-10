"use client";

import { useState } from "react";

/**
 * Fragen links, eine Antwort rechts. Am Telefon öffnet die gewählte Frage ihre Antwort darunter.
 * Ohne Skript steht die erste Antwort da; alle Antworten liegen im Dokument.
 */
export function FaqIndex({ heading, items }: { heading: string; items: [string, string][] }) {
  const [i, setI] = useState(0);
  return (
    <div className="hp-fq">
      <ul className="hp-fq-list">
        <li className="hp-fq-head"><h2 id="hp-fragen">{heading}</h2></li>
        {items.map(([q, a], k) => (
          <li key={k}>
            <button type="button" data-on={k === i} aria-expanded={k === i} onClick={() => setI(k)} onMouseEnter={() => setI(k)} onFocus={() => setI(k)}>
              <span className="hp-fq-dot" aria-hidden="true" />
              {q}
            </button>
            <p className="hp-fq-inline" hidden={k !== i}>{a}</p>
          </li>
        ))}
      </ul>
      <div className="hp-fq-pane" aria-live="polite">
        {items.map(([, a], k) => (
          <p key={k} data-on={k === i} aria-hidden={k !== i}>{a}</p>
        ))}
      </div>
    </div>
  );
}
