import type {
  Capability,
  MemberRole,
  OrganizationStatus,
  VerificationStatus,
} from "@prisma/client";

/**
 * Berechtigungen ergeben sich aus DREI Faktoren, die alle serverseitig geprüft werden:
 *  1. Rolle des Nutzers in der Organisation (was darf diese Person?)
 *  2. Verifizierte Geschäftsfunktion der Organisation (was darf diese Firma?)
 *  3. Kontostatus der Organisation (aktiv / eingeschränkt / gesperrt)
 */
export const PERMISSIONS = [
  // Verwaltung der eigenen Organisation
  "org.read",
  "org.update",
  "members.read",
  "members.manage",
  "documents.read",
  "documents.manage",
  "capabilities.request",
  "billing.read",
  // Beförderungsunternehmen (erfordert verifiziertes TRANSPORT_PROVIDER)
  "fleet.manage",
  "capacity.publish",
  "jobs.accept",
  "quotes.submit",
  "trips.drive",
  // Auftraggeber (erfordert verifiziertes TRANSFER_BOOKER)
  "transfers.request",
  "bookings.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL = new Set<Permission>(PERMISSIONS);

export const ROLE_PERMISSIONS: Record<MemberRole, ReadonlySet<Permission>> = {
  OWNER: ALL,
  ADMIN: ALL,
  DISPATCHER: new Set<Permission>([
    "org.read",
    "members.read",
    "documents.read",
    "fleet.manage",
    "capacity.publish",
    "jobs.accept",
    "quotes.submit",
    "trips.drive",
    "transfers.request",
    "bookings.manage",
  ]),
  BOOKER: new Set<Permission>(["org.read", "members.read", "transfers.request", "bookings.manage"]),
  FINANCE: new Set<Permission>(["org.read", "members.read", "documents.read", "billing.read"]),
  VIEWER: new Set<Permission>(["org.read", "members.read"]),
  DRIVER: new Set<Permission>(["org.read", "trips.drive"]),
};

/** Welche verifizierte Geschäftsfunktion eine Berechtigung zusätzlich voraussetzt. */
export const PERMISSION_CAPABILITY: Partial<Record<Permission, Capability>> = {
  "fleet.manage": "TRANSPORT_PROVIDER",
  "capacity.publish": "TRANSPORT_PROVIDER",
  "jobs.accept": "TRANSPORT_PROVIDER",
  "quotes.submit": "TRANSPORT_PROVIDER",
  "trips.drive": "TRANSPORT_PROVIDER",
  "transfers.request": "TRANSFER_BOOKER",
  "bookings.manage": "TRANSFER_BOOKER",
};

/** Bei gesperrtem Konto bleibt nur Lesezugriff auf die eigenen Stammdaten. */
const SUSPENDED_ALLOWED = new Set<Permission>(["org.read", "members.read", "documents.read"]);

export type OrgAuthzInput = {
  role: MemberRole;
  orgStatus: OrganizationStatus;
  capabilities: Partial<Record<Capability, VerificationStatus>>;
};

export type Decision = { allowed: true } | { allowed: false; reason: string };

export function decide(input: OrgAuthzInput, permission: Permission): Decision {
  if (!ROLE_PERMISSIONS[input.role].has(permission)) {
    return { allowed: false, reason: "Ihre Rolle erlaubt diese Aktion nicht." };
  }
  if (input.orgStatus === "SUSPENDED" && !SUSPENDED_ALLOWED.has(permission)) {
    return { allowed: false, reason: "Das Konto Ihrer Organisation ist gesperrt." };
  }
  const required = PERMISSION_CAPABILITY[permission];
  if (required) {
    if (input.orgStatus === "RESTRICTED") {
      return {
        allowed: false,
        reason: "Das Konto Ihrer Organisation ist eingeschränkt. Marktplatzfunktionen sind deaktiviert.",
      };
    }
    if (input.capabilities[required] !== "VERIFIED") {
      return {
        allowed: false,
        reason:
          required === "TRANSPORT_PROVIDER"
            ? "Diese Funktion ist verifizierten Beförderungsunternehmen vorbehalten."
            : "Diese Funktion erfordert eine verifizierte Auftraggeber-Freischaltung.",
      };
    }
  }
  return { allowed: true };
}

export function can(input: OrgAuthzInput, permission: Permission): boolean {
  return decide(input, permission).allowed;
}

/** Rollen, die ein Nutzer mit `actorRole` vergeben bzw. verwalten darf. */
export function assignableRoles(actorRole: MemberRole): MemberRole[] {
  if (actorRole === "OWNER") return ["OWNER", "ADMIN", "DISPATCHER", "DRIVER", "BOOKER", "FINANCE", "VIEWER"];
  if (actorRole === "ADMIN") return ["ADMIN", "DISPATCHER", "DRIVER", "BOOKER", "FINANCE", "VIEWER"];
  return [];
}
