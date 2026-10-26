"use client";

import { useMemo, useState } from "react";
import { translate, type Locale, type Vars } from "@/lib/i18n";
import { EXAMPLE_QUERIES, matchOrders } from "./sample-orders";

export function RouteDemo({ locale }: { locale: Locale }) {
  const t = (k: string, v?: Vars) => translate(locale, k, v);
  const euro = new Intl.NumberFormat(locale === "en" ? "en-GB" : "de-AT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const examples = EXAMPLE_QUERIES.map((q) => t(q));
  const [query, setQuery] = useState(examples[0]);
  const results = useMemo(() => matchOrders(query), [query]);
  const [selected, setSelected] = useState(0);
  const current = results[Math.min(selected, results.length - 1)];

  return (
    <div className="lp-demo">
      <label className="lp-sr" htmlFor="lp-route">{t("Strecke eingeben")}</label>
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
            {results.length === 1 ? t("1 offener Auftrag") : t("{n} offene Aufträge", { n: results.length })} {t("auf dieser Strecke · Beispieldaten")}
          </p>
          {results.length === 0 ? (
            <p className="lp-results-empty">{t("Keine Aufträge in den Beispieldaten. Probieren Sie eine Strecke mit dem Flughafen München.")}</p>
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
                    <span className="lp-r-when">{t(o.day)} {o.time}</span>
                    <span className="lp-r-route">{t(o.from)} → {t(o.to)}</span>
                    <span className="lp-r-load">{t("{n} Pers.", { n: o.pax })} · {t(o.luggage)}</span>
                    <span className="lp-r-price">
                      <strong>{euro.format(o.price)}</strong>
                      <em>{t(o.priceKind)}</em>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {current && (
          <div className="lp-offer" data-ui>
            <p className="lp-offer-id">{t("Auftrag")} {current.id}</p>
            <p className="lp-offer-route">{t(current.from)} → {t(current.to)}</p>
            <dl>
              <dt>{t("Abholung")}</dt><dd>{t(current.day)}, {t("{time} Uhr", { time: current.time })}</dd>
              <dt>{t("Fahrgäste")}</dt><dd>{current.pax} · {t(current.luggage)}</dd>
              <dt>{t("Fahrzeug")}</dt><dd>{t(current.vehicle)}</dd>
              {current.note && (<><dt>{t("Hinweis")}</dt><dd>{t(current.note)}</dd></>)}
              <dt>{t(current.priceKind)}</dt><dd>{euro.format(current.price)}</dd>
            </dl>
            <p className="lp-offer-action">
              {current.priceKind === "Festpreis"
                ? t("Zum Festpreis übernehmen: der Preis ist sofort verbindlich.")
                : t("Richtpreis: Sie geben ein eigenes Angebot ab, der Auftraggeber entscheidet.")}
            </p>
          </div>
        )}
      </div>

      <div className="lp-examples">
        {examples.map((q) => (
          <button key={q} type="button" onClick={() => { setQuery(q); setSelected(0); }}>{q}</button>
        ))}
      </div>
    </div>
  );
}
