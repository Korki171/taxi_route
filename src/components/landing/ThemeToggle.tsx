"use client";

import { useState } from "react";
import { THEME_ORDER, type HpTheme } from "@/lib/theme";

type Labels = Record<HpTheme, string>;

/**
 * Umschalter für die Darstellung: automatisch (nach Gerät), hell, dunkel. Ein Klick geht zur nächsten Stellung.
 * Die Wahl steht im Cookie hp-theme, damit der Server gleich richtig rendert (kein Aufblitzen); „automatisch“ löscht das Cookie.
 * Das Symbol zeigt die aktuelle Stellung, die Beschriftung nennt sie und die nächste.
 */
export function ThemeToggle({ initial, labels, nextLabel }: { initial: HpTheme; labels: Labels; nextLabel: string }) {
  const [theme, setTheme] = useState<HpTheme>(initial);
  const next = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length];
  const label = `${labels[theme]}. ${nextLabel}: ${labels[next]}`;
  return (
    <button
      type="button"
      className="hp-theme"
      aria-label={label}
      title={label}
      onClick={(e) => {
        const root = e.currentTarget.closest<HTMLElement>(".hp, .auth");
        if (root) root.dataset.theme = next;
        document.cookie = next === "auto"
          ? "hp-theme=; path=/; max-age=0; samesite=lax"
          : `hp-theme=${next}; path=/; max-age=31536000; samesite=lax`;
        setTheme(next);
      }}
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M20 14.6A8.5 8.5 0 0 1 9.4 4a8.5 8.5 0 1 0 10.6 10.6Z" fill="currentColor" /></svg>
      ) : theme === "light" ? (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor" /><g stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></g></svg>
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" /></svg>
      )}
    </button>
  );
}
