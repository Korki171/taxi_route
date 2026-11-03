"use client";

import { useEffect } from "react";

/**
 * Bewegungsschicht der Landing Page: Einblenden der Abschnittsteile, Mappen, die beim Scrollen
 * auffächern, und die Vorschau der Abflugtafel. Ohne Skript bleibt alles sichtbar und bedienbar.
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

    // Mappenstapel: beim Scrollen durch den Hero fächern die Mappen auf.
    const hero = root.querySelector<HTMLElement>(".lp-hero");
    let frame = 0;
    const onScroll = () => {
      if (!hero || reduce) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const p = Math.min(1, Math.max(0, window.scrollY / hero.offsetHeight));
        hero.style.setProperty("--spread", (p * 1.6).toFixed(3));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Abflugtafel: die Zeile unter dem Zeiger bringt ihr Bild in den festen Rahmen.
    const rows = [...root.querySelectorAll<HTMLElement>(".lp-idx-row")];
    const shots = [...root.querySelectorAll<HTMLElement>(".lp-idx-frame [data-for]")];
    const show = (idx: string) => {
      for (const s of shots) {
        s.classList.toggle("is-on", s.dataset.for === idx);
        if (s instanceof HTMLVideoElement) {
          if (s.dataset.for === idx && !reduce) void s.play().catch(() => {});
          else s.pause();
        }
      }
    };
    const enter = (e: Event) => show((e.currentTarget as HTMLElement).dataset.idx ?? "");
    rows.forEach((r) => r.addEventListener("pointerenter", enter));
    if (reduce) shots.forEach((s) => s instanceof HTMLVideoElement && s.pause());

    // Auf Touch-Geräten steht das Bild in der Zeile; der Film darin läuft nur, solange er zu sehen ist.
    const inline = root.querySelector<HTMLVideoElement>("video.lp-idx-inline");
    const vio = new IntersectionObserver(([e]) => {
      if (!inline || reduce || getComputedStyle(inline).display === "none") return;
      if (e.isIntersecting) void inline.play().catch(() => {});
      else inline.pause();
    });
    if (inline) vio.observe(inline);

    return () => {
      io.disconnect();
      vio.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      rows.forEach((r) => r.removeEventListener("pointerenter", enter));
    };
  }, []);
  return null;
}
