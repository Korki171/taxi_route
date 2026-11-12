/** Darstellung der Startseite und der Anmeldeseiten. „auto“ folgt der Einstellung des Geräts (Cookie hp-theme fehlt). */
export type HpTheme = "auto" | "light" | "dark";

export const THEME_ORDER: HpTheme[] = ["auto", "light", "dark"];

export function themeFromCookie(v: string | undefined): HpTheme {
  return v === "light" || v === "dark" ? v : "auto";
}
