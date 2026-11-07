/**
 * Abgabe-Anteil: Wer eine Fahrt in der Börse abgibt, kann einen Prozentsatz vom
 * Fahrpreis für sich behalten. Das übernehmende Unternehmen fährt für den Rest.
 * Die Abrechnung erfolgt direkt zwischen den Unternehmen; Transferborsa nimmt
 * kein Geld entgegen und erhält davon nichts.
 */

/** Höchster Anteil, den ein Abgeber festlegen kann (in Prozent). */
export const MAX_HANDOFF_SHARE_PERCENT = 15;

/** Auswahl im Formular. */
export const HANDOFF_SHARE_OPTIONS = [0, 3, 5, 7, 10, 12, 15] as const;

export type HandoffSplit = {
  /** Fahrpreis (vereinbart bzw. ausgeschrieben) */
  priceCents: number;
  percent: number;
  /** Betrag, der beim Abgeber bleibt */
  shareCents: number;
  /** Betrag für das ausführende Unternehmen */
  providerCents: number;
};

/** Teilt einen Fahrpreis in Anteil des Abgebers und Betrag für den Übernehmer (auf ganze Cent gerundet). */
export function splitHandoff(priceCents: number, percent: number): HandoffSplit {
  const p = Math.min(Math.max(Math.trunc(percent) || 0, 0), 100);
  const shareCents = Math.round((priceCents * p) / 100);
  return { priceCents, percent: p, shareCents, providerCents: priceCents - shareCents };
}
