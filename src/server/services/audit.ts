import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type Tx = Prisma.TransactionClient | typeof db;

export async function audit(
  tx: Tx,
  e: {
    actorUserId: string | null;
    organizationId?: string | null;
    action: string;
    targetType?: string;
    targetId?: string;
    data?: Prisma.InputJsonValue;
  },
) {
  await tx.auditEvent.create({ data: { ...e, organizationId: e.organizationId ?? null } });
}
