/** Regeln für Bewertungen, geteilt zwischen Server und Oberfläche. */

/** So lange nach dem Abschluss der Fahrt kann bewertet werden (lange Zahlungsziele, wie bei TIMOCOM). */
export const RATING_WINDOW_DAYS = 104;
/** Ab so vielen sichtbaren Bewertungen wird der Schnitt öffentlich gezeigt. */
export const RATING_MIN_PUBLIC = 3;

/** Die drei Kategorien je Rolle: der Auftraggeber bewertet etwas anderes als das ausführende Unternehmen. */
export const RATING_CATEGORIES = {
  requester: ["communication", "punctuality", "passengerCare"],
  provider: ["communication", "fairness", "payment"],
} as const;

export type RatingCategory = (typeof RATING_CATEGORIES)[keyof typeof RATING_CATEGORIES][number];

export const RATING_CATEGORY_LABEL: Record<RatingCategory, string> = {
  communication: "Kommunikation",
  punctuality: "Pünktlichkeit",
  passengerCare: "Umgang mit den Fahrgästen",
  fairness: "Fairness der Absprachen",
  payment: "Zahlungsmoral",
};
