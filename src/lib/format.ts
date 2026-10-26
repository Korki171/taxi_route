const dt = new Intl.DateTimeFormat("de-AT", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Vienna" });
const d = new Intl.DateTimeFormat("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Vienna" });
const t = new Intl.DateTimeFormat("de-AT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Vienna" });

export const fmtDateTime = (x: Date | null | undefined) => (x ? dt.format(x) : "–");
export const fmtDate = (x: Date | null | undefined) => (x ? d.format(x) : "–");
export const fmtTime = (x: Date | null | undefined) => (x ? t.format(x) : "–");

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
