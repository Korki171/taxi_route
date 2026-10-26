import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "../auth/password";
import { createSession } from "../auth/session";
import { AppError } from "../errors";
import { rateLimit, resetRateLimit } from "../rate-limit";
import { emailSchema, parse } from "../validation";
import { z } from "zod";

// Dummy-Hash, damit unbekannte E-Mails gleich lange brauchen (kein User-Enumeration-Timing).
let dummyHash: Promise<string> | null = null;

export async function login(input: unknown, meta: { ip?: string } = {}) {
  const { email, password } = parse(
    z.object({ email: emailSchema, password: z.string().min(1).max(200) }),
    input,
  );
  // Schutz gegen Passwort-Raten: je E-Mail und je IP-Adresse
  await rateLimit(`login:email:${email}`, 10, 15);
  if (meta.ip) await rateLimit(`login:ip:${meta.ip}`, 50, 15);
  const user = await db.user.findUnique({
    where: { email },
    include: { memberships: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  dummyHash ??= hashPassword("timing-equalizer-password");
  const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
  if (!user || !ok || user.status !== "ACTIVE") {
    throw new AppError("UNAUTHENTICATED", "E-Mail oder Passwort ist falsch.");
  }
  await resetRateLimit(`login:email:${email}`);
  return createSession(user.id, user.memberships[0]?.organizationId ?? null);
}

/** Wechselt die aktive Organisation – nur zu Organisationen, in denen der Nutzer Mitglied ist. */
export async function switchActiveOrganization(sessionId: string, userId: string, orgId: string) {
  const m = await db.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });
  if (!m) throw new AppError("FORBIDDEN", "Sie sind kein Mitglied dieser Organisation.");
  await db.session.update({ where: { id: sessionId }, data: { activeOrgId: orgId } });
}
