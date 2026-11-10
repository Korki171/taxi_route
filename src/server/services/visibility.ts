import type { Prisma } from "@prisma/client";

/**
 * Wer einen Auftrag sehen darf. Börsenaufträge je nach Stufe: MARKET alle geprüften Unternehmen,
 * PARTNERS nur die Partner des Auftraggebers, OWN niemand außer dem Auftraggeber selbst.
 * Gezielte Anfragen sehen nur die eingeladenen, solange sie nicht abgelehnt haben.
 */
export const VISIBLE_TO = (orgId: string): Prisma.TransferRequestWhereInput => ({
  // Sperrliste des Auftraggebers gilt immer
  requesterOrg: { blocks: { none: { blockedOrgId: orgId } } },
  OR: [
    { visibility: "MARKET", audience: "MARKET" },
    { visibility: "MARKET", audience: "PARTNERS", requesterOrg: { partners: { some: { partnerOrgId: orgId } } } },
    { invitations: { some: { providerOrgId: orgId, status: { in: ["PENDING", "RESPONDED"] } } } },
  ],
});
