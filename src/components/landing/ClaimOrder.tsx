"use client";

import { useState } from "react";

type Labels = {
  open: string; taken: string; when: string; route: string; load: string; fixed: string;
  claim: string; reset: string; by: string; hint: string;
};

/**
 * Die eine lebendige Stelle der Startseite: eine offene Fahrt lässt sich übernehmen.
 * Ohne Skript bleibt sie „Offen“. Der Zustand wechselt über data-taken, die Übergänge liegen in home.css.
 */
export function ClaimOrder({ L }: { L: Labels }) {
  const [taken, setTaken] = useState(false);
  return (
    <div className="hp-claim" data-taken={taken}>
      <div className="hp-card hp-order" aria-live="polite">
        <div className="hp-order-top">
          <span className="hp-chip hp-chip-open hp-chip-a">{L.open}</span>
          <span className="hp-chip hp-chip-taken hp-chip-b" aria-hidden={!taken}>{L.taken}</span>
          <span className="hp-muted hp-when">{L.when}</span>
        </div>
        <p className="hp-order-route">{L.route}</p>
        <p className="hp-muted">{L.load}</p>
        <div className="hp-order-price"><b>310 €</b><span>{L.fixed}</span></div>
        <p className="hp-order-by">{L.by}</p>
        <div className="hp-order-actions">
          <button type="button" className="hp-fake hp-fake-primary" onClick={() => setTaken(true)} disabled={taken}>{L.claim}</button>
          <button type="button" className="hp-fake" onClick={() => setTaken(false)} disabled={!taken}>{L.reset}</button>
        </div>
      </div>
      <p className="hp-hint">{L.hint}</p>
    </div>
  );
}
