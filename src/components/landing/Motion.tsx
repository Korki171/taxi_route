"use client";

import { useEffect } from "react";

/**
 * Bewegungsschicht der Landing Page: Einblenden der Abschnittsteile, Kopfzeile in der Farbe
 * des aktuellen Kapitels, wechselnd hervorgehobener Ortsname. Ohne Skript bleibt alles sichtbar.
 */
export function Motion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".lp");
    if (!root) return;
    root.classList.add("lp-js");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Einblenden: Überschrift, dann Text, dann Bild, je Abschnitt gestaffelt.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    root.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

    // Kopfzeile nimmt die Tinte des Kapitels darunter an.
    const header = root.querySelector<HTMLElement>(".lp-header");
    const chapters = [...root.querySelectorAll<HTMLElement>("[data-ink]")];
    const onScroll = () => {
      if (!header) return;
      const y = header.getBoundingClientRect().height / 2;
      const under = chapters.find((c) => {
        const r = c.getBoundingClientRect();
        return r.top <= y && r.bottom > y;
      });
      header.dataset.ink = under?.dataset.ink ?? "paper";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Ortsnamen nacheinander hervorheben.
    const names = [...root.querySelectorAll<HTMLElement>(".lp-places b")];
    let i = 0;
    const timer = reduce || names.length === 0 ? null : window.setInterval(() => {
      names.forEach((n, k) => n.classList.toggle("is-lit", k === i));
      i = (i + 1) % names.length;
    }, 2000);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (timer) window.clearInterval(timer);
    };
  }, []);
  return null;
}
