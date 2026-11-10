"use client";

import { useState } from "react";

export type HpTheme = "light" | "dark";

/** Umschalter hell/dunkel im Kopf der Startseite. Merkt sich die Wahl im Cookie hp-theme, damit der Server gleich richtig rendert (kein Aufblitzen). */
export function ThemeToggle({ initial, labels }: { initial: HpTheme; labels: { toDark: string; toLight: string } }) {
  const [theme, setTheme] = useState(initial);
  const next: HpTheme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="hp-theme"
      aria-label={theme === "dark" ? labels.toLight : labels.toDark}
      title={theme === "dark" ? labels.toLight : labels.toDark}
      onClick={(e) => {
        const root = e.currentTarget.closest<HTMLElement>(".hp");
        if (root) root.dataset.theme = next;
        document.cookie = `hp-theme=${next}; path=/; max-age=31536000; samesite=lax`;
        setTheme(next);
      }}
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor" /><g stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></g></svg>
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M20 14.6A8.5 8.5 0 0 1 9.4 4a8.5 8.5 0 1 0 10.6 10.6Z" fill="currentColor" /></svg>
      )}
    </button>
  );
}
