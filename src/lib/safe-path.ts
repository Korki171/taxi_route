/**
 * Gibt `next` nur zurück, wenn es ein Pfad auf dieser Seite ist, sonst `fallback`.
 * Schützt Rücksprungziele (?next=) vor Open Redirects wie "//böse.de", "/\böse.de" oder "/\t/böse.de",
 * die Browser als fremde Adresse lesen.
 */
export function safeInternalPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || /[\\\u0000-\u001f\u007f]/.test(next)) return fallback;
  try {
    const base = "http://intern.invalid";
    const u = new URL(next, base);
    if (u.origin !== base) return fallback;
    return u.pathname + u.search + u.hash;
  } catch {
    return fallback;
  }
}
