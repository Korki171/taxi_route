import type { DocumentType } from "@prisma/client";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { makeT } from "@/lib/i18n";
import { appUrl, sendAll, type Email } from "../email";

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

/** So viele Tage vor dem Ablauf wird gewarnt (E-Mail und Hinweis in der App). */
export const EXPIRY_WARN_DAYS = 30;

/** Geprüfte Nachweise, die in den nächsten 30 Tagen ablaufen oder schon abgelaufen sind. */
export async function expiringDocuments(orgId: string, now = new Date()) {
  return db.verificationDocument.findMany({
    where: { organizationId: orgId, status: "APPROVED", validUntil: { lte: new Date(now.getTime() + EXPIRY_WARN_DAYS * 86_400_000) } },
    orderBy: { validUntil: "asc" },
    select: { id: true, type: true, validUntil: true },
  });
}

/**
 * Ablaufwarnung per E-Mail: einmal 30 Tage vor dem Ablauf und einmal am Tag des Ablaufs. Läuft mit dem
 * Zeitgeber der Börse (/api/cron/escalate) und ist wiederholbar, jede Stufe geht nur einmal raus.
 */
export async function sendExpiryNotices(now = new Date()): Promise<number> {
  const docs = await db.verificationDocument.findMany({
    where: {
      status: "APPROVED",
      organization: { status: "ACTIVE" },
      OR: [
        { expiryNotice: { lt: 2 }, validUntil: { lte: now } },
        { expiryNotice: 0, validUntil: { lte: new Date(now.getTime() + EXPIRY_WARN_DAYS * 86_400_000) } },
      ],
    },
    select: { id: true, type: true, validUntil: true, organization: { select: { email: true, country: true } } },
    take: 200,
  });
  const mails: Email[] = [];
  for (const d of docs) {
    const expired = d.validUntil! <= now;
    const locale = ["AT", "DE", "CH", "LI"].includes(d.organization.country) ? "de" : "en";
    const t = makeT(locale);
    const vars = { doc: t(DOCUMENT_LABELS[d.type]), date: fmtDate(d.validUntil, locale) };
    mails.push({
      to: d.organization.email,
      subject: `Transferborsa: ${t(expired ? "{doc} ist abgelaufen" : "{doc} läuft am {date} ab", vars)}`,
      text: [
        t(expired ? "Ihr Nachweis „{doc}“ ist am {date} abgelaufen." : "Ihr Nachweis „{doc}“ läuft am {date} ab.", vars),
        t("Bitte laden Sie das neue Dokument unter „Nachweise“ hoch, damit Ihr Betrieb weiter als geprüft gilt."),
        "",
        appUrl("/organization/documents"),
        "",
        "—",
        t("Diese Nachricht wurde automatisch von Transferborsa verschickt."),
      ].join("\n"),
    });
    await db.verificationDocument.update({ where: { id: d.id }, data: { expiryNotice: expired ? 2 : 1 } });
  }
  await sendAll(mails);
  return mails.length;
}
