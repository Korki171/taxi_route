import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "../auth/password";
import { invalidateAllSessions } from "../auth/session";
import { generateToken, hashToken } from "../auth/tokens";
import { appUrl, sendEmail } from "../email";
import { notFound } from "../errors";
import { rateLimit } from "../rate-limit";
import { emailSchema, parse, passwordSchema } from "../validation";
import { audit } from "./audit";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 Stunde

/**
 * Verschickt einen Link zum Zurücksetzen. Die Antwort ist immer gleich, damit sich
 * nicht herausfinden lässt, ob eine E-Mail-Adresse registriert ist.
 */
export async function requestPasswordReset(input: unknown) {
  const { email } = parse(z.object({ email: emailSchema }), input);
  await rateLimit(`reset:${email}`, 3, 60);
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE") return;

  const token = generateToken();
  await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) },
  });
  await sendEmail({
    to: user.email,
    subject: "Transferborsa: Passwort zurücksetzen / Reset your password",
    text: [
      `Hallo ${user.name},`,
      "",
      "über diesen Link können Sie ein neues Passwort festlegen. Er ist eine Stunde gültig und funktioniert nur einmal:",
      appUrl(`/passwort-zuruecksetzen/${token}`),
      "",
      "Wenn Sie das nicht angefordert haben, ignorieren Sie diese E-Mail. Ihr Passwort bleibt unverändert.",
      "",
      "—",
      "Use the link above within one hour to set a new password. If you did not request this, ignore this email.",
    ].join("\n"),
  });
}

async function findValidToken(token: string) {
  const row = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.usedAt || row.expiresAt <= new Date()) throw notFound("Der Link ist ungültig oder abgelaufen.");
  return row;
}

export async function checkPasswordResetToken(token: string) {
  await findValidToken(token);
}

/** Setzt das Passwort, entwertet den Link und meldet alle Sitzungen ab. */
export async function resetPassword(token: string, input: unknown) {
  const { password } = parse(z.object({ password: passwordSchema }), input);
  const row = await findValidToken(token);
  const res = await db.passwordResetToken.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } });
  if (res.count !== 1) throw notFound("Der Link ist ungültig oder abgelaufen.");
  await db.user.update({ where: { id: row.userId }, data: { passwordHash: await hashPassword(password) } });
  await invalidateAllSessions(row.userId);
  await audit(db, { actorUserId: row.userId, action: "user.password_reset", targetId: row.userId });
  return row.userId;
}
