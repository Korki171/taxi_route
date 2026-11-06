import type { OrganizationType, SubscriptionPlan } from "@prisma/client";

/**
 * Abo-Tarife für Taxi-/Transferunternehmen. Preise netto pro Monat in Cent, keine Provision pro Fahrt.
 * Reisebüros, Hotels und Reiseveranstalter nutzen Transferborsa kostenlos.
 * Die Fahrzeuggrenze ist vorerst ein Richtwert: sie wird angezeigt, aber nicht technisch erzwungen.
 */
export const PLANS: {
  id: SubscriptionPlan;
  name: string;
  priceCents: number;
  /** null = unbegrenzt */
  vehicleLimit: number | null;
  summary: string;
  features: string[];
}[] = [
  {
    id: "BASIS",
    name: "Basis",
    priceCents: 3999,
    vehicleLimit: 3,
    summary: "Für kleine Betriebe mit wenigen Fahrzeugen.",
    features: [
      "Bis zu 3 Fahrzeuge",
      "Aufträge übernehmen und einstellen",
      "Freie Rückfahrten anbieten",
      "Direktanfragen von Reisebüros",
      "Live-Karte und Fahrer-App",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    priceCents: 7999,
    vehicleLimit: 10,
    summary: "Für Betriebe mit eigener Disposition.",
    features: [
      "Bis zu 10 Fahrzeuge",
      "Alles aus Basis",
      "Mitarbeiter mit eigenen Rollen",
    ],
  },
  {
    id: "FLOTTE",
    name: "Flotte",
    priceCents: 17999,
    vehicleLimit: null,
    summary: "Für große Flotten und Transferunternehmen.",
    features: [
      "Unbegrenzt Fahrzeuge und Fahrer",
      "Alles aus Pro",
      "Bevorzugter Support",
    ],
  },
];

export const PLAN_BY_ID = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<SubscriptionPlan, (typeof PLANS)[number]>;

/** Nur Beförderungsunternehmen zahlen. */
export const isPayingType = (type: OrganizationType) => type === "TRANSPORT_COMPANY";

export type PlanStatus =
  | { kind: "FREE_ROLE" }
  | { kind: "NONE" }
  | { kind: "TRIAL"; until: Date }
  | { kind: "ACTIVE" };

/** Abo-Stand eines Unternehmens zum Zeitpunkt `now`. */
export function planStatus(
  org: { type: OrganizationType; plan: SubscriptionPlan | null; planFreeUntil: Date | null },
  now = new Date(),
): PlanStatus {
  if (!isPayingType(org.type)) return { kind: "FREE_ROLE" };
  if (org.planFreeUntil && org.planFreeUntil >= now) return { kind: "TRIAL", until: org.planFreeUntil };
  if (org.plan) return { kind: "ACTIVE" };
  return { kind: "NONE" };
}

/** Badge-Ton passend zu statusTone(). */
export const PLAN_STATUS_TONE: Record<PlanStatus["kind"], string> = {
  FREE_ROLE: "ACTIVE",
  TRIAL: "ACTIVE",
  ACTIVE: "ACTIVE",
  NONE: "PENDING",
};
