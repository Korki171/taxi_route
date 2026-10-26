/**
 * Mehrsprachigkeit (Deutsch und Englisch).
 *
 * Der deutsche Text ist der Schlüssel: `t("Anmelden")` liefert auf Deutsch den Text selbst
 * und auf Englisch den Eintrag aus `EN`. Fehlt eine Übersetzung, bleibt der deutsche Text
 * stehen (tests/i18n.test.ts prüft, dass alle Texte im Code übersetzt sind).
 * Platzhalter: `t("Einladung zu {name}", { name })`.
 */
import { EN } from "./i18n-en";

export type Locale = "de" | "en";
export const LOCALES: Locale[] = ["de", "en"];
export const LOCALE_COOKIE = "tr_lang";

export type Vars = Record<string, string | number>;

export function translate(locale: Locale, key: string, vars?: Vars): string {
  const text = locale === "en" ? (EN[key] ?? key) : key;
  return vars ? text.replace(/\{(\w+)\}/g, (m: string, k: string) => (k in vars ? String(vars[k]) : m)) : text;
}

export type T = (key: string, vars?: Vars) => string;

export function makeT(locale: Locale): T {
  return (key, vars) => translate(locale, key, vars);
}

/** Wählt die Sprache aus Cookie oder Accept-Language (Deutsch für den Startmarkt, sonst Englisch). */
export function pickLocale(cookie: string | undefined, acceptLanguage: string | null): Locale {
  if (cookie === "de" || cookie === "en") return cookie;
  const first = acceptLanguage?.split(",")[0]?.trim().toLowerCase() ?? "de";
  return first.startsWith("de") || first === "*" ? "de" : "en";
}
