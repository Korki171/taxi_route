"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

type Item = { name: string; text: string; node: ReactNode };

/**
 * Dunkle Fläche, eine Reihe von App-Ausschnitten. Nur der mittlere ist hell und bedienbar, die anderen stehen
 * mit 22 % daneben (inert). Wischen, Ziehen, Pfeiltasten oder die Knöpfe schalten weiter.
 */
export function Showcase({ items, prev, next }: { items: Item[]; prev: string; next: string }) {
  const [i, setI] = useState(0);
  const row = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  const onScroll = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = row.current;
      if (!el) return;
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0, d = Infinity;
      Array.from(el.children).forEach((c, k) => {
        const h = c as HTMLElement;
        const dd = Math.abs(h.offsetLeft + h.offsetWidth / 2 - mid);
        if (dd < d) { d = dd; best = k; }
      });
      setI(best);
    });
  }, []);

  const go = (k: number) => {
    const el = row.current;
    const target = el?.children[Math.max(0, Math.min(items.length - 1, k))] as HTMLElement | undefined;
    if (el && target) el.scrollTo({ left: target.offsetLeft + target.offsetWidth / 2 - el.clientWidth / 2, behavior: "smooth" });
  };

  return (
    <div className="hp-sc">
      <div
        className="hp-sc-row" ref={row} onScroll={onScroll} tabIndex={0}
        onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1); } if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); } }}
      >
        {items.map((it, k) => (
          <div key={k} className="hp-sc-panel" data-on={k === i} inert={k !== i}>{it.node}</div>
        ))}
      </div>
      <div className="hp-sc-text" aria-live="polite">
        <p className="hp-sc-name">{items[i].name}</p>
        <p>{items[i].text}</p>
        <div className="hp-sc-nav">
          <button type="button" onClick={() => go(i - 1)} disabled={i === 0} aria-label={prev}>←</button>
          <button type="button" onClick={() => go(i + 1)} disabled={i === items.length - 1} aria-label={next}>→</button>
        </div>
      </div>
    </div>
  );
}
