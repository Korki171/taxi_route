/**
 * Storno und No-Show. Den Vertrag schließen die beiden Unternehmen direkt miteinander: die Stornobedingungen
 * stehen als Freitext am Auftrag und gelten mit der Annahme. Transferborsa rechnet keine Gebühren aus,
 * entscheidet keinen Streit und zieht kein Geld ein, sondern dokumentiert nur (Verlauf und Storno-Beleg).
 */

/** So lange nach der Abholzeit muss der Fahrer am Abholort gewartet haben, bevor er einen No-Show meldet. */
export const NO_SHOW_WAIT_MINUTES = 30;
/** Bei Abholungen mit Flugnummer (Gepäck, Zoll) länger. */
export const NO_SHOW_WAIT_MINUTES_FLIGHT = 60;

export function noShowWaitMinutes(flightNumber: string | null | undefined): number {
  return flightNumber ? NO_SHOW_WAIT_MINUTES_FLIGHT : NO_SHOW_WAIT_MINUTES;
}

/** Ab wann ein No-Show gemeldet werden darf. */
export function noShowAllowedFrom(pickupAt: Date, flightNumber?: string | null): Date {
  return new Date(pickupAt.getTime() + noShowWaitMinutes(flightNumber) * 60_000);
}

/** Buchungen in diesen Zuständen haben einen Storno-Beleg und erlauben je Seite eine Stellungnahme. */
export const CLOSED_BY_CANCEL = ["CANCELLED", "NO_SHOW"] as const;
export function isCancelClosed(status: string): status is (typeof CLOSED_BY_CANCEL)[number] {
  return (CLOSED_BY_CANCEL as readonly string[]).includes(status);
}
