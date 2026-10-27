import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { pickLocale, translate } from "@/lib/i18n";
import { EN } from "@/lib/i18n-en";
import * as labels from "@/lib/labels";
import { PLACES, REGION_LABEL } from "@/lib/places";
import { EVENT_LABEL } from "@/server/services/transfer-events";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return p.includes(`${join("src", "app", "admin")}`) ? [] : files(p);
    return /\.tsx?$/.test(p) ? [p] : [];
  });
}

/** Alle Texte, die in der App übersetzt angezeigt werden (Adminbereich bleibt Deutsch). */
function keysInSource(): Set<string> {
  const keys = new Set<string>();
  const add = (re: RegExp, src: string) => { for (const m of src.matchAll(re)) keys.add(m[1]); };
  for (const file of files("src")) {
    const src = readFileSync(file, "utf8");
    add(/\bt\("((?:[^"\\]|\\.)+)"/g, src);
    add(/\b(?:AppError\("[A-Z_]+",|notFound\(|forbidden\(|invalid\(|conflict\()\s*"([^"]+)"/g, src);
    if (file.endsWith("validation.ts")) add(/, "([^"]+)"\)/g, src);
    if (file.endsWith("notifications.ts") || file.endsWith("matching.ts") || file.endsWith("permissions.ts")) add(/"([A-ZÄÖÜa-zäöü{][^"]*\s[^"]*)"/g, src);
  }
  for (const map of Object.values(labels)) if (typeof map === "object") Object.values(map).forEach((v) => keys.add(v as string));
  Object.values(EVENT_LABEL).forEach((v) => keys.add(v));
  Object.values(REGION_LABEL).forEach((v) => keys.add(v));
  // Ortsnamen bleiben ohne Eintrag gleich; nur Flughäfen und Orte mit englischem Namen sind übersetzt.
  PLACES.filter((p) => p.name.startsWith("Flughafen")).forEach((p) => keys.add(p.name));
  keys.delete("Benachrichtigung fehlgeschlagen"); // nur Server-Log
  return keys;
}

describe("Übersetzungen", () => {
  it("jeder angezeigte Text hat eine englische Übersetzung", () => {
    const missing = [...keysInSource()].filter((k) => !(k in EN)).filter((k) => !/^(TaxiRoute|Transferborsa|–|·)$/.test(k));
    expect(missing).toEqual([]);
  });

  it("englische Texte behalten alle Platzhalter", () => {
    const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    const broken = Object.entries(EN).filter(([de, en]) => vars(de).join() !== vars(en).join()).map(([de]) => de);
    expect(broken).toEqual([]);
  });

  it("setzt Platzhalter ein und fällt ohne Eintrag auf Deutsch zurück", () => {
    expect(translate("de", "Neues Angebot für {ref}", { ref: "TR-1" })).toBe("Neues Angebot für TR-1");
    expect(translate("en", "Anmelden")).toBe(EN["Anmelden"]);
    expect(translate("en", "gibt es nicht")).toBe("gibt es nicht");
  });

  it("wählt die Sprache aus Cookie, sonst aus dem Browser", () => {
    expect(pickLocale("en", "de-AT,de")).toBe("en");
    expect(pickLocale(undefined, "de-AT,de;q=0.9")).toBe("de");
    expect(pickLocale(undefined, "it-IT,it;q=0.9,en;q=0.8")).toBe("en");
    expect(pickLocale(undefined, null)).toBe("de");
  });
});
