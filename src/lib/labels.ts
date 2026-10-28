import type {
  Capability,
  DocumentStatus,
  MemberRole,
  OrganizationStatus,
  OrganizationType,
  VehicleCategory,
  VerificationStatus,
} from "@prisma/client";

export const ORG_TYPE_LABEL: Record<OrganizationType, string> = {
  TRANSPORT_COMPANY: "Taxi-/Transferunternehmen",
  TRAVEL_AGENCY: "Reisebüro",
  TOUR_OPERATOR: "Reiseveranstalter",
  HOTEL: "Hotel",
};

export const ORG_STATUS_LABEL: Record<OrganizationStatus, string> = {
  ACTIVE: "Aktiv",
  RESTRICTED: "Eingeschränkt",
  SUSPENDED: "Gesperrt",
};

export const CAPABILITY_LABEL: Record<Capability, string> = {
  TRANSPORT_PROVIDER: "Beförderungsunternehmen (Fahrzeuge, Kapazitäten, Auftragsübernahme)",
  TRANSFER_BOOKER: "Auftraggeber (Transfers anfragen und buchen)",
};

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  UNVERIFIED: "Ungeprüft",
  PENDING_REVIEW: "In Prüfung",
  VERIFIED: "Geprüft",
  REJECTED: "Abgelehnt",
  SUSPENDED: "Gesperrt",
};

export const DOC_STATUS_LABEL: Record<DocumentStatus, string> = {
  PENDING: "Ungeprüft",
  APPROVED: "Geprüft",
  REJECTED: "Abgelehnt",
};

export const ROLE_LABEL: Record<MemberRole, string> = {
  OWNER: "Inhaber",
  ADMIN: "Administrator",
  DISPATCHER: "Disposition",
  BOOKER: "Buchung",
  FINANCE: "Buchhaltung",
  VIEWER: "Nur lesen",
  DRIVER: "Fahrer",
};

export const TRIP_STAGE_LABEL: Record<string, string> = {
  TO_PICKUP: "Auf dem Weg zur Abholung",
  AT_PICKUP: "Am Abholort",
  ON_BOARD: "Fahrgast an Bord",
};

export const VEHICLE_LABEL: Record<VehicleCategory, string> = {
  SEDAN: "Limousine",
  ESTATE: "Kombi",
  MINIVAN: "Minivan (bis 6)",
  VAN: "Van (bis 8)",
  MINIBUS: "Kleinbus",
  BUS: "Bus",
  LUXURY: "Premium",
  WHEELCHAIR: "Rollstuhlgerecht",
};

export function statusTone(s: string): "ok" | "warn" | "bad" | "neutral" {
  if (["VERIFIED", "APPROVED", "ACTIVE", "CONFIRMED", "ACCEPTED", "COMPLETED", "ASSIGNED", "RESPONDED"].includes(s)) return "ok";
  if (["PENDING_REVIEW", "PENDING", "RESTRICTED", "SUBMITTED", "IN_PROGRESS", "PLANNED", "OPEN"].includes(s)) return "warn";
  if (["REJECTED", "SUSPENDED", "CANCELLED", "DISPUTED", "DECLINED"].includes(s)) return "bad";
  return "neutral";
}

/** Gesamtanzeige: ungeprüft / geprüft / gesperrt (Anforderung Kernfunktion G). */
export function overallVerification(
  orgStatus: OrganizationStatus,
  caps: { status: VerificationStatus }[],
): { label: string; tone: ReturnType<typeof statusTone> } {
  if (orgStatus === "SUSPENDED") return { label: "Gesperrt", tone: "bad" };
  if (caps.some((c) => c.status === "VERIFIED")) return { label: "Geprüft", tone: "ok" };
  if (caps.some((c) => c.status === "PENDING_REVIEW")) return { label: "In Prüfung", tone: "warn" };
  return { label: "Ungeprüft", tone: "neutral" };
}

export const TRANSFER_STATUS_LABEL: Record<string, string> = {
  OPEN: "Offen",
  ASSIGNED: "Vergeben",
  IN_PROGRESS: "Unterwegs",
  COMPLETED: "Abgeschlossen",
  CANCELLED: "Storniert",
  DISPUTED: "Beanstandet",
};

export const BOOKING_STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Bestätigt",
  IN_PROGRESS: "Unterwegs",
  COMPLETED: "Abgeschlossen",
  CANCELLED: "Storniert",
  DISPUTED: "Beanstandet",
};

export const QUOTE_STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Abgegeben",
  WITHDRAWN: "Zurückgezogen",
  ACCEPTED: "Angenommen",
  REJECTED: "Abgelehnt",
};

export const CAPACITY_STATUS_LABEL: Record<string, string> = {
  PLANNED: "Geplant, unverbindlich",
  CONFIRMED: "Bestätigt",
  WITHDRAWN: "Zurückgezogen",
};

/** Preiszustände klar getrennt (Kernfunktion E). */
export function priceStateLabel(mode: "FIXED" | "NEGOTIABLE"): string {
  return mode === "FIXED" ? "Festpreis" : "Richtpreis (unverbindlich)";
}

export const INVITATION_STATUS_LABEL: Record<string, string> = {
  PENDING: "Angefragt",
  RESPONDED: "Hat reagiert",
  DECLINED: "Abgelehnt",
};

export const VISIBILITY_LABEL: Record<string, string> = {
  MARKET: "Ganze Börse",
  INVITED: "Gezielte Anfrage",
};
