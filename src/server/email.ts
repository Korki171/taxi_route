/**
 * E-Mail-Versand über Resend (HTTP-API, kein SDK nötig).
 *
 * Ohne RESEND_API_KEY wird nichts verschickt: die Nachricht landet im Server-Log und im
 * Postausgang `sentEmails` (für Tests und lokale Entwicklung).
 */

export type Email = { to: string; subject: string; text: string };

export const sentEmails: Email[] = [];

export function appUrl(path = "") {
  const base =
    process.env.APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
  return base.replace(/\/$/, "") + path;
}

export async function sendEmail(mail: Email): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    sentEmails.push(mail);
    if (sentEmails.length > 200) sentEmails.shift();
    if (process.env.NODE_ENV !== "test") console.info(`[E-Mail, nicht versendet] an ${mail.to}: ${mail.subject}\n${mail.text}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "TaxiRoute <onboarding@resend.dev>",
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
    }),
  });
  if (!res.ok) throw new Error(`E-Mail-Versand fehlgeschlagen (${res.status}): ${await res.text()}`);
}

/**
 * Für Benachrichtigungen: ein fehlgeschlagener Versand darf die fachliche Aktion nicht
 * rückgängig machen. Fehler werden protokolliert.
 */
export async function sendAll(mails: Email[]): Promise<void> {
  const results = await Promise.allSettled(mails.map(sendEmail));
  for (const r of results) if (r.status === "rejected") console.error(r.reason);
}
