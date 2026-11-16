/**
 * Regelbasierter Filter für Bewertungskommentare und Antworten, ohne KI und ohne externen Dienst
 * (ähnlich Discord AutoMod): Text vereinheitlichen, gegen eine Wortliste mit Ausnahmen prüfen und
 * Kontaktdaten (Telefon, E-Mail, Links) sperren. Was durchrutscht, fangen „Melden“ und die Admins ab.
 */

const LEET: Record<string, string> = { "4": "a", "@": "a", "3": "e", "€": "e", "1": "i", "!": "i", "0": "o", "5": "s", "$": "s", "7": "t", "ß": "ss" };

/** Beleidigungen und Schimpfwörter, Deutsch und Englisch, bereits vereinheitlicht (siehe `normalize`). */
const BAD_WORDS = [
  // Deutsch
  "arsch", "arschloch", "wichser", "wixer", "fotze", "hurensohn", "hure", "nutte", "nutten", "schlampe", "missgeburt",
  "spast", "spasti", "mongo", "idiot", "vollidiot", "trotel", "voltrotel", "depp", "deppen",
  "dumkopf", "dummkopf", "drecksau", "drecksack", "dreckskerl", "drecksfirma", "drecksladen", "scheis", "scheise",
  "schweinehund", "saukerl", "penner", "bastard", "betruger", "betrüger", "abzocker", "verbrecher", "kriminel",
  "verreck", "fick", "ficken", "gefickt", "kanake", "zigeuner", "neger", "schwuchtel", "untermensch",
  "abschaum", "pisser", "kotzbrocken", "honk", "vollpfosten",
  // Englisch
  "asshole", "bitch", "cunt", "fuck", "fucker", "fucking", "motherfucker", "shit", "bullshit",
  "retard", "moron", "scum", "whore", "slut", "nigger", "nigga", "faggot", "scammer", "fraudster",
  "wanker", "twat", "prick", "dumbass", "jackass",
] as const;

/** Wörter, die ein gesperrtes Wort enthalten, aber harmlos sind (vereinheitlicht). */
const ALLOWED = new Set([
  "marsch", "marschieren", "einmarsch", "barsch", "barscher", "barsche", "spastik", "spastisch", "shitstorm",
].map(squash));

/** Kurze Wörter nur als ganzes Wort sperren, damit z. B. „Sauna“ oder „Dickicht“ durchgehen. */
const WHOLE_WORD_ONLY = new Set(["nutte", "nutten", "depp", "honk", "hure", "spast", "mongo", "shit", "prick", "twat", "fick", "penner"].map(squash));

/** Kleinschreibung, Leetspeak zurück, Umlaute vereinfacht, nur Buchstaben, Wiederholungen zusammengezogen. */
function squash(word: string): string {
  let s = "";
  for (const ch of word.toLowerCase()) s += LEET[ch] ?? ch;
  s = s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
  return s.replace(/(.)\1+/g, "$1");
}

const BAD = [...new Set(BAD_WORDS.map(squash))];

/** Wörter des Textes vereinheitlicht; Folgen einzelner Buchstaben („A r s c h“) werden zusammengezogen. */
function words(text: string): string[] {
  const raw = text.split(/[\s,.;:!?()"'„“”\-–_/*+#~|]+/).filter(Boolean);
  const out: string[] = [];
  let run = "";
  for (const r of raw) {
    const w = squash(r);
    if (w.length === 1 && r.length <= 2) { run += w; continue; }
    if (run.length > 1) out.push(run);
    run = "";
    if (w) out.push(w);
  }
  if (run.length > 1) out.push(run);
  // Mit Sternchen oder Punkten zerlegte Wörter („A*sch“, „a.r.s.c.h“) zusätzlich als Ganzes prüfen
  for (const token of text.split(/\s+/)) {
    const w = squash(token.replace(/[*.\-_]/g, ""));
    if (w && !out.includes(w)) out.push(w);
  }
  return out;
}

/** „A*schloch“, „F**k“: Sternchen stehen für ein oder zwei verdeckte Buchstaben. */
function maskedBadWord(text: string): boolean {
  for (const token of text.split(/\s+/)) {
    if (!token.includes("*")) continue;
    const parts = token.split(/\*+/).map(squash);
    if (parts.join("").length < 2) continue;
    const re = new RegExp(`^${parts.join("[a-z]{1,2}")}`);
    if (BAD.some((bad) => re.test(bad))) return true;
  }
  return false;
}

function containsBadWord(text: string): boolean {
  if (maskedBadWord(text)) return true;
  for (const w of words(text)) {
    if (ALLOWED.has(w)) continue;
    for (const bad of BAD) {
      if (WHOLE_WORD_ONLY.has(bad) ? w === bad : w.includes(bad)) return true;
    }
  }
  return false;
}

/** Telefonnummern: mindestens 9 Ziffern am Stück (mit Leerzeichen, Schrägstrich, Klammern); Datumsangaben haben weniger. */
const PHONE = /(?:\+|\b00)?\d[\d\s/().-]{6,}\d/g;
function hasPhone(text: string) {
  return (text.match(PHONE) ?? []).some((m) => (m.match(/\d/g) ?? []).length >= 9);
}
const EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
const LINK = /\bhttps?:\/\/|\bwww\.|\b[a-z0-9-]+\.(?:at|de|com|net|org|info|eu|ch|it|io)\b/i;

export type TextCheck = { ok: true } | { ok: false; reason: "insult" | "contact" };

/** Prüft einen Kommentar oder eine Antwort, bevor sie gespeichert wird. */
export function checkText(text: string): TextCheck {
  if (containsBadWord(text)) return { ok: false, reason: "insult" };
  if (hasPhone(text) || EMAIL.test(text) || LINK.test(text)) return { ok: false, reason: "contact" };
  return { ok: true };
}

export const TEXT_CHECK_MESSAGE: Record<"insult" | "contact", string> = {
  insult: "Der Text enthält eine Beleidigung. Bitte formulieren Sie sachlich.",
  contact: "Bitte keine Telefonnummern, E-Mail-Adressen oder Links in Bewertungen.",
};
