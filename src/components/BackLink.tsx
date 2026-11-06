"use client";

/**
 * „Zurück“: kam man von einer Seite dieser Website, geht es dorthin zurück (wie der Zurück-Knopf
 * des Browsers). Sonst, etwa bei einem direkt geöffneten Link, führt er zu `fallback`.
 */
export function BackLink({ fallback, children }: { fallback: string; children: React.ReactNode }) {
  function onClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    let sameSite = false;
    try { sameSite = !!document.referrer && new URL(document.referrer).origin === window.location.origin; } catch {}
    if (sameSite && window.history.length > 1) {
      e.preventDefault();
      window.history.back();
    }
  }
  return <a href={fallback} onClick={onClick}>{children}</a>;
}
