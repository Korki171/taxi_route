/**
 * Storno- und No-Show-Regeln. Die Regel steht am Auftrag und wird bei der Annahme in die Buchung übernommen:
 * kostenlos bis `freeCancelHours` Stunden vor der Abholung, danach `lateCancelPercent` % des vereinbarten Preises.
 * Die Gebühr zahlt nur der Auftraggeber, wenn er zu spät storniert; bei einem No-Show der volle Preis.
 * Transferborsa rechnet die Gebühr nur aus und hält sie fest, bezahlt wird direkt zwischen den Firmen.
 */

export const FREE_CANCEL_HOURS = [2, 6, 12, 24, 48] as const;
export const LATE_CANCEL_PERCENT = [0, 50, 100] as const;
export const DEFAULT_FREE_CANCEL_HOURS = 24;
export const DEFAULT_LATE_CANCEL_PERCENT = 50;

/** So lange nach der Abholzeit muss der Fahrer am Abholort gewartet haben, bevor er einen No-Show meldet. */
export const NO_SHOW_WAIT_MINUTES = 30;

export type CancelRule = { freeCancelHours: number | null; lateCancelPercent: number | null };

export function hasRule(r: CancelRule): r is { freeCancelHours: number; lateCancelPercent: number } {
  return r.freeCancelHours != null && r.lateCancelPercent != null;
}

/** Gebühr, wenn der Auftraggeber jetzt storniert. 0 ohne Regel oder innerhalb der kostenlosen Frist. */
export function lateCancelFeeCents(rule: CancelRule, pickupAt: Date, agreedPriceCents: number, now = new Date()): number {
  if (!hasRule(rule) || rule.lateCancelPercent === 0) return 0;
  const freeUntil = pickupAt.getTime() - rule.freeCancelHours * 3600_000;
  if (now.getTime() < freeUntil) return 0;
  return Math.round((agreedPriceCents * rule.lateCancelPercent) / 100);
}

/** Bis wann der Auftraggeber kostenlos stornieren kann (null ohne Regel). */
export function freeCancelUntil(rule: CancelRule, pickupAt: Date): Date | null {
  return hasRule(rule) ? new Date(pickupAt.getTime() - rule.freeCancelHours * 3600_000) : null;
}

/** Ab wann ein No-Show gemeldet werden darf. */
export function noShowAllowedFrom(pickupAt: Date): Date {
  return new Date(pickupAt.getTime() + NO_SHOW_WAIT_MINUTES * 60_000);
}

type T = (key: string, vars?: Record<string, string | number>) => string;

/** Regel als Satz, z. B. „Kostenlos bis 24 Stunden vor Abholung, danach 50 % des Preises.“ */
export function cancelRuleText(t: T, rule: CancelRule): string | null {
  if (!hasRule(rule)) return null;
  if (rule.lateCancelPercent === 0) return t("Jederzeit kostenlos stornierbar.");
  return t("Kostenlos bis {h} Stunden vor Abholung, danach {p} % des Preises.", { h: rule.freeCancelHours, p: rule.lateCancelPercent });
}
