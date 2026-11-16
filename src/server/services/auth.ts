import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "../auth/password";
import { randomInt } from "node:crypto";
import { createSession } from "../auth/session";
import { generateToken, hashToken } from "../auth/tokens";
import { sendEmail } from "../email";
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
  // Schutz gegen Passwort-Raten. Streng je E-Mail und IP-Adresse (10 in 15 Min.), damit ein Fremder
  // ein Konto nicht für dessen Besitzer sperren kann; dazu eine lockere Obergrenze je E-Mail gegen
  // verteiltes Raten und eine je IP-Adresse gegen das Durchprobieren vieler Konten.
  const pairKey = `login:email:${email}:${meta.ip ?? "-"}`;
  await rateLimit(pairKey, 10, 15);
  await rateLimit(`login:email:${email}`, 100, 60);
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
  await resetRateLimit(pairKey);
  if (user.twoFactorEmail) return { challenge: await startLoginChallenge(user) };
  return createSession(user.id, user.memberships[0]?.organizationId ?? null);
}

// ---------------------------------------------------------------------------
// Zwei-Faktor-Anmeldung: Code per E-Mail
// ---------------------------------------------------------------------------

const CODE_TTL_MS = 10 * 60_000;
const MAX_CODE_ATTEMPTS = 5;
const codeHash = (challengeId: string, code: string) => hashToken(`${challengeId}:${code}`);

/** Passwort stimmte: Code per E-Mail schicken. Gibt das Token für die Code-Seite zurück. */
async function startLoginChallenge(user: { id: string; email: string; name: string }) {
  const token = generateToken();
  const id = hashToken(token);
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.loginChallenge.deleteMany({ where: { OR: [{ userId: user.id }, { expiresAt: { lt: new Date() } }] } });
  await db.loginChallenge.create({ data: { id, userId: user.id, codeHash: codeHash(id, code), expiresAt: new Date(Date.now() + CODE_TTL_MS) } });
  await sendEmail({
    to: user.email,
    subject: `Transferborsa: Ihr Anmeldecode ${code} / Your sign-in code`,
    text: [
      `Hallo ${user.name},`,
      "",
      `Ihr Code für die Anmeldung: ${code}`,
      "Er ist 10 Minuten gültig. Wenn Sie sich nicht gerade anmelden, ändern Sie bitte Ihr Passwort.",
      "",
      "—",
      `Your sign-in code: ${code}. It is valid for 10 minutes. If you are not signing in right now, please change your password.`,
    ].join("\n"),
  });
  return token;
}

/** Zweiter Schritt der Anmeldung: Code prüfen, dann erst entsteht die Sitzung. */
export async function verifyLoginCode(challengeToken: string, code: unknown) {
  const expired = () => new AppError("UNAUTHENTICATED", "Der Code ist abgelaufen. Bitte melden Sie sich erneut an.");
  const id = hashToken(String(challengeToken));
  const ch = await db.loginChallenge.findUnique({ where: { id }, include: { user: { include: { memberships: { orderBy: { createdAt: "asc" }, take: 1 } } } } });
  if (!ch || ch.expiresAt <= new Date() || ch.user.status !== "ACTIVE") throw expired();
  if (ch.attempts >= MAX_CODE_ATTEMPTS) {
    await db.loginChallenge.delete({ where: { id } }).catch(() => undefined);
    throw expired();
  }
  const given = String(code ?? "").replace(/\D/g, "");
  if (codeHash(id, given) !== ch.codeHash) {
    await db.loginChallenge.update({ where: { id }, data: { attempts: { increment: 1 } } });
    throw new AppError("VALIDATION", "Der Code stimmt nicht.");
  }
  // Einmalig: nur wer die offene Anmeldung löscht, bekommt die Sitzung.
  const res = await db.loginChallenge.deleteMany({ where: { id } });
  if (res.count !== 1) throw expired();
  return createSession(ch.userId, ch.user.memberships[0]?.organizationId ?? null);
}

/** Schaltet den E-Mail-Code für das eigene Konto ein oder aus. */
export async function setTwoFactorEmail(userId: string, on: boolean) {
  await db.user.update({ where: { id: userId }, data: { twoFactorEmail: on } });
  if (!on) await db.loginChallenge.deleteMany({ where: { userId } });
}

/** Wechselt die aktive Organisation – nur zu Organisationen, in denen der Nutzer Mitglied ist. */
export async function switchActiveOrganization(sessionId: string, userId: string, orgId: string) {
  const m = await db.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });
  if (!m) throw new AppError("FORBIDDEN", "Sie sind kein Mitglied dieser Organisation.");
  await db.session.update({ where: { id: sessionId }, data: { activeOrgId: orgId } });
}
