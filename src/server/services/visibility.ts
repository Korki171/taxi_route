import type { Prisma } from "@prisma/client";

/**
 * Wer einen Auftrag sehen darf: Börsenaufträge alle geprüften Unternehmen, gezielte Anfragen nur
 * die eingeladenen, solange sie nicht abgelehnt haben.
 */
export const VISIBLE_TO = (orgId: string): Prisma.TransferRequestWhereInput => ({
  OR: [
    { visibility: "MARKET" },
    { invitations: { some: { providerOrgId: orgId, status: { in: ["PENDING", "RESPONDED"] } } } },
  ],
});
