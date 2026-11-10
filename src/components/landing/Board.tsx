"use client";

import { useState } from "react";

type Row = { time: string; route: string; persons: string; price: string; status: string; tone: "open" | "taken" | "ok" | "plain" };
type Labels = {
  caption: string; head: string[]; claim: string; reset: string; taken: string; by: string; hint: string;
};

/**
 * Die Tafel: heutige Fahrten als Zeilen. Die erste lässt sich übernehmen, ihr Stand wechselt von „Offen“ zu „Vergeben“.
 * Ohne Skript bleibt sie „Offen“. Der Wechsel der Wörter läuft über data-taken und home.css.
 */
export function Board({ rows, L }: { rows: Row[]; L: Labels }) {
  const [taken, setTaken] = useState(false);
  return (
    <div className="hp-board" data-taken={taken}>
      <table>
        <caption className="hp-sr">{L.caption}</caption>
        <thead>
          <tr>{L.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const mine = i === 0 && taken;
            return (
              <tr key={r.time} style={{ ["--i" as string]: i }}>
                <td data-label={L.head[0]}>{r.time}</td>
                <td data-label={L.head[1]}>{r.route}</td>
                <td data-label={L.head[2]}>{r.persons}</td>
                <td data-label={L.head[3]}>{r.price}</td>
                <td data-label={L.head[4]}><span className={`hp-st hp-st-${mine ? "taken" : r.tone}`}>{mine ? L.taken : r.status}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="hp-board-act">
        <button type="button" className="hp-btn" onClick={() => setTaken(true)} disabled={taken}>{L.claim}</button>
        <button type="button" className="hp-btn hp-btn-ghost" onClick={() => setTaken(false)} disabled={!taken}>{L.reset}</button>
        <p aria-live="polite">{taken ? L.by : L.hint}</p>
      </div>
    </div>
  );
}
