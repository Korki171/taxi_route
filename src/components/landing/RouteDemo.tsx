"use client";

import { useMemo, useState } from "react";
import { EXAMPLE_QUERIES, matchOrders } from "./sample-orders";

const euro = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export function RouteDemo() {
  const [query, setQuery] = useState(EXAMPLE_QUERIES[0]);
  const results = useMemo(() => matchOrders(query), [query]);
  const [selected, setSelected] = useState(0);
  const current = results[Math.min(selected, results.length - 1)];

  return (
    <div className="lp-demo">
      <label className="lp-sr" htmlFor="lp-route">Strecke eingeben</label>
      <div className="lp-typeline" data-ui>
        <input
          id="lp-route"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      <div className="lp-demo-grid">
        <div className="lp-results" data-ui aria-live="polite">
          <p className="lp-results-head">
            {results.length === 1 ? "1 offener Auftrag" : `${results.length} offene Aufträge`} auf dieser Strecke · Beispieldaten
          </p>
          {results.length === 0 ? (
            <p className="lp-results-empty">Keine Aufträge in den Beispieldaten. Probieren Sie eine Strecke mit dem Flughafen München.</p>
          ) : (
            <ul>
              {results.slice(0, 4).map((o, i) => (
                <li key={o.id}>
                  <button
                    type="button"
                    className={i === selected ? "is-selected" : undefined}
                    aria-pressed={i === selected}
                    onClick={() => setSelected(i)}
                  >
                    <span className="lp-r-when">{o.day} {o.time}</span>
                    <span className="lp-r-route">{o.from} → {o.to}</span>
                    <span className="lp-r-load">{o.pax} Pers. · {o.luggage}</span>
                    <span className="lp-r-price">
                      <strong>{euro.format(o.price)}</strong>
                      <em>{o.priceKind}</em>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {current && (
          <div className="lp-offer" data-ui>
            <p className="lp-offer-id">Auftrag {current.id}</p>
            <p className="lp-offer-route">{current.from} → {current.to}</p>
            <dl>
              <dt>Abholung</dt><dd>{current.day}, {current.time} Uhr</dd>
              <dt>Fahrgäste</dt><dd>{current.pax} · {current.luggage}</dd>
              <dt>Fahrzeug</dt><dd>{current.vehicle}</dd>
              {current.note && (<><dt>Hinweis</dt><dd>{current.note}</dd></>)}
              <dt>{current.priceKind}</dt><dd>{euro.format(current.price)}</dd>
            </dl>
            <p className="lp-offer-action">
              {current.priceKind === "Festpreis"
                ? "Zum Festpreis übernehmen: der Preis ist sofort verbindlich."
                : "Richtpreis: Sie geben ein eigenes Angebot ab, der Auftraggeber entscheidet."}
            </p>
          </div>
        )}
      </div>

      <div className="lp-examples">
        {EXAMPLE_QUERIES.map((q) => (
          <button key={q} type="button" onClick={() => { setQuery(q); setSelected(0); }}>{q}</button>
        ))}
      </div>
    </div>
  );
}
