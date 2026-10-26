import type { Locale } from "./i18n";

const TZ = "Europe/Vienna";
const tag = (l: Locale) => (l === "en" ? "en-GB" : "de-AT");
const cache = new Map<string, Intl.DateTimeFormat>();
function df(l: Locale, kind: "dt" | "d" | "t") {
  const key = l + kind;
  let f = cache.get(key);
  if (!f) {
    const opts: Intl.DateTimeFormatOptions =
      kind === "dt" ? { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: TZ }
      : kind === "d" ? { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ }
      : { hour: "2-digit", minute: "2-digit", timeZone: TZ };
    f = new Intl.DateTimeFormat(tag(l), opts);
    cache.set(key, f);
  }
  return f;
}

export const fmtDateTime = (x: Date | null | undefined, l: Locale = "de") => (x ? df(l, "dt").format(x) : "–");
export const fmtDate = (x: Date | null | undefined, l: Locale = "de") => (x ? df(l, "d").format(x) : "–");
export const fmtTime = (x: Date | null | undefined, l: Locale = "de") => (x ? df(l, "t").format(x) : "–");

export function fmtMinutes(m: number | null | undefined) {
  if (m == null) return "–";
  const h = Math.floor(m / 60);
  return h ? `${h} h ${String(m % 60).padStart(2, "0")} min` : `${m} min`;
}

/** Wert für <input type="datetime-local"> in Wiener Zeit. */
export function toLocalInput(x: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
      .formatToParts(x).map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour === "24" ? "00" : parts.hour}:${parts.minute}`;
}

/** Interpretiert "2026-11-14T05:40" als Wiener Ortszeit. */
export function fromLocalInput(v: string): Date | null {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v);
  if (!m) return null;
  const guess = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
  // Offset der Zeitzone zu diesem Zeitpunkt bestimmen
  const asVienna = new Date(guess.toLocaleString("en-US", { timeZone: "Europe/Vienna" }));
  const asUtc = new Date(guess.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(guess.getTime() - (asVienna.getTime() - asUtc.getTime()));
}
