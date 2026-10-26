import type { DocumentType } from "@prisma/client";
import { db } from "@/lib/db";

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  BUSINESS_LICENSE: "Gewerbeberechtigung",
  TAXI_CONCESSION: "Taxikonzession",
  RENTAL_CAR_LICENSE: "Mietwagenkonzession",
  INSURANCE: "Versicherungsnachweis",
  COMMERCIAL_REGISTER: "Firmenbuch-/Handelsregisterauszug",
  OTHER: "Sonstiges",
};

/**
 * Pflichtnachweise für die Funktion Beförderungsunternehmen:
 *  – Taxi- ODER Mietwagenkonzession
 *  – Versicherungsnachweis
 * Abgelaufene oder abgelehnte Dokumente zählen nicht.
 * includePending=true: für den Antrag genügen hochgeladene, noch ungeprüfte Dokumente.
 * includePending=false: für die Freigabe müssen sie vom Admin geprüft sein.
 */
export async function missingTransportDocuments(
  orgId: string,
  { includePending }: { includePending: boolean },
): Promise<string[]> {
  const docs = await db.verificationDocument.findMany({
    where: {
      organizationId: orgId,
      status: includePending ? { in: ["PENDING", "APPROVED"] } : "APPROVED",
      OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
    },
    select: { type: true },
  });
  const types = new Set(docs.map((d) => d.type));
  const missing: string[] = [];
  if (!types.has("TAXI_CONCESSION") && !types.has("RENTAL_CAR_LICENSE")) {
    missing.push(`${DOCUMENT_LABELS.TAXI_CONCESSION} oder ${DOCUMENT_LABELS.RENTAL_CAR_LICENSE}`);
  }
  if (!types.has("INSURANCE")) missing.push(DOCUMENT_LABELS.INSURANCE);
  return missing;
}
