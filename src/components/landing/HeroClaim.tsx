"use client";

import { useState } from "react";
import { TaxiSign } from "./TaxiSign";

type Labels = {
  free: string; busy: string; open: string; taken: string;
  route: string; when: string; load: string; price: string; fixed: string;
  claim: string; by: string; gone: string; reset: string; hint: string;
};

/** Die erste Seite: das Schild über einer echten Fahrtkarte. Übernehmen schaltet FREI auf BESETZT. */
export function HeroClaim({ L }: { L: Labels }) {
  const [taken, setTaken] = useState(false);
  return (
    <div className="hp-stage">
      <TaxiSign label={taken ? L.busy : L.free} on={!taken} />
      <div className="hp-ride" data-ui>
        <p className="hp-ride-chip" data-state={taken ? "taken" : "open"}>{taken ? L.taken : L.open}</p>
        <p className="hp-ride-route">{L.route}</p>
        <p className="hp-ride-meta">{L.when}</p>
        <p className="hp-ride-meta">{L.load}</p>
        <p className="hp-ride-price">{L.price} <span>{L.fixed}</span></p>
        <div aria-live="polite">
          {taken ? (
            <p className="hp-ride-by">
              {L.by} {L.gone}{" "}
              <button type="button" className="hp-textbtn" onClick={() => setTaken(false)}>{L.reset}</button>
            </p>
          ) : (
            <>
              <button type="button" className="hp-btn hp-ride-claim" onClick={() => setTaken(true)}>{L.claim}</button>
              <p className="hp-ride-hint">{L.hint}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
