import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type Tx = Prisma.TransactionClient | typeof db;

export async function transferEvent(
  tx: Tx,
  requestId: string,
  type: string,
  actor: { userId: string; orgId: string } | null,
  data?: Prisma.InputJsonValue,
) {
  await tx.transferEvent.create({
    data: { requestId, type, actorUserId: actor?.userId, actorOrgId: actor?.orgId, data },
  });
}

export const EVENT_LABEL: Record<string, string> = {
  "request.created": "Auftrag veröffentlicht",
  "request.cancelled": "Auftrag zurückgezogen",
  "request.invited": "Unternehmen gezielt angefragt",
  "request.opened_to_market": "Für die ganze Börse freigegeben",
  "invitation.declined": "Anfrage abgelehnt",
  "quote.submitted": "Angebot abgegeben",
  "quote.withdrawn": "Angebot zurückgezogen",
  "quote.rejected": "Angebot abgelehnt",
  "quote.accepted": "Angebot angenommen",
  "booking.fixed_price_taken": "Zum Festpreis übernommen",
  "booking.started": "Fahrt begonnen",
  "booking.at_pickup": "Fahrer am Abholort",
  "booking.on_board": "Fahrgast an Bord",
  "booking.completed": "Fahrt abgeschlossen",
  "booking.cancelled": "Buchung storniert",
  "booking.disputed": "Beanstandung gemeldet",
};
