"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type NavItem = { href: string; label: string };

/** Längster passender Pfad gewinnt: /flotte/live markiert „Live-Karte“, nicht „Flotte“. */
function currentHref(items: NavItem[], path: string) {
  return items
    .filter((i) => path === i.href || path.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

/**
 * Hauptnavigation der App. Auf breiten Bildschirmen eine Zeile mit Unterstrich unter der aktiven
 * Seite, darunter faltet sie sich in ein Menü, das die ganze Breite einnimmt (Fahrer am Handy).
 */
export function ShellNav({ items, name, scope, labels, children }: {
  items: NavItem[];
  name: string;
  scope?: string;
  labels: { nav: string; menu: string; close: string; account: string };
  children: React.ReactNode;
}) {
  const path = usePathname();
  const current = currentHref(items, path);
  const [open, setOpen] = useState(false);
  const account = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    setOpen(false);
    account.current?.removeAttribute("open");
  }, [path]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpen(false);
      account.current?.removeAttribute("open");
    }
    function onClick(e: MouseEvent) {
      if (account.current?.open && !account.current.contains(e.target as Node)) account.current.removeAttribute("open");
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  const links = items.map((i) => (
    <Link key={i.href} href={i.href} aria-current={i.href === current ? "page" : undefined}>{i.label}</Link>
  ));

  return (
    <>
      <nav className="shell-nav" aria-label={labels.nav}>{links}</nav>
      <details className="shell-account" ref={account}>
        <summary aria-label={labels.account}>
          <span className="who-name">{name}</span>
          {scope && <span className="who-scope">{scope}</span>}
        </summary>
        <div className="shell-pop">{children}</div>
      </details>
      <button type="button" className="shell-burger" aria-expanded={open} aria-controls="shell-sheet" onClick={() => setOpen((o) => !o)}>
        {open ? labels.close : labels.menu}
      </button>
      {open && (
        <div id="shell-sheet" className="shell-sheet">
          <nav aria-label={labels.nav}>{links}</nav>
          {children}
        </div>
      )}
    </>
  );
}
