"use client";

import { useState } from "react";

type Labels = {
  open: string; taken: string; when: string; route: string; load: string; fixed: string;
  claim: string; reset: string; by: string; hint: string;
};

/** Die eine lebendige Stelle der Startseite: eine offene Fahrt lässt sich übernehmen. Ohne Skript bleibt sie „Offen“. */
export function ClaimOrder({ L }: { L: Labels }) {
  const [taken, setTaken] = useState(false);
  return (
    <div className="hp-claim">
      <div className="hp-card hp-order" aria-live="polite">
        <div className="hp-order-top">
          <span className={`hp-chip ${taken ? "hp-chip-taken" : "hp-chip-open"}`}>{taken ? L.taken : L.open}</span>
          <span className="hp-muted">{L.when}</span>
        </div>
        <p className="hp-order-route">{L.route}</p>
        <p className="hp-muted">{L.load}</p>
        <div className="hp-order-price"><b>310 €</b><span>{L.fixed}</span></div>
        <p className="hp-order-by" hidden={!taken}>{L.by}</p>
        <div className="hp-order-actions">
          {taken
            ? <button type="button" className="hp-fake" onClick={() => setTaken(false)}>{L.reset}</button>
            : <button type="button" className="hp-fake hp-fake-primary" onClick={() => setTaken(true)}>{L.claim}</button>}
        </div>
      </div>
      <p className="hp-hint">{L.hint}</p>
    </div>
  );
}
