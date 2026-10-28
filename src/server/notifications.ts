/**
 * E-Mail-Benachrichtigungen zu Aufträgen und Buchungen. Empfänger ist die geschäftliche
 * E-Mail-Adresse der jeweiligen Organisation. Die Sprache richtet sich nach dem Land der
 * Organisation (deutschsprachige Länder Deutsch, sonst Englisch).
 *
 * Benachrichtigungen enthalten keine Fahrgastdaten und keine genauen Adressen; Details
 * stehen nach der Anmeldung in der App.
 */
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { makeT, type Locale } from "@/lib/i18n";
import { formatCents } from "@/lib/money";
import { placeName } from "@/lib/places";
import { appUrl, sendAll, type Email } from "./email";
import { referenceOf } from "./services/marketplace";

type Org = { email: string; name: string; country: string };

const localeOf = (country: string): Locale => (["AT", "DE", "CH", "LI"].includes(country) ? "de" : "en");

type Req = { id: string; number: number; pickupPlaceId: string; dropoffPlaceId: string; pickupAt: Date };

function mail(org: Org, req: Req, subject: string, lines: string[], vars: Record<string, string | number> = {}): Email {
  const locale = localeOf(org.country);
  const t = makeT(locale);
  const v = {
    ref: referenceOf(req.number),
    route: `${t(placeName(req.pickupPlaceId))} → ${t(placeName(req.dropoffPlaceId))}`,
    pickup: fmtDateTime(req.pickupAt, locale),
    ...vars,
  };
  return {
    to: org.email,
    subject: `Transferborsa: ${t(subject, v)}`,
    text: [
      ...lines.map((l) => t(l, v)),
      "",
      appUrl(`/boerse/auftrag/${req.id}`),
      "",
      "—",
      t("Diese Nachricht wurde automatisch von Transferborsa verschickt."),
    ].join("\n"),
  };
}

const orgSelect = { email: true, name: true, country: true } as const;

/**
 * Neuer Auftrag: eingeladene Unternehmen erhalten eine Direktanfrage. Börsenaufträge gehen zusätzlich
 * an alle übrigen geprüften, aktiven Beförderungsunternehmen außer dem Auftraggeber.
 */
export async function notifyNewRequest(requestId: string) {
  const req = await db.transferRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: { requesterOrg: { select: orgSelect }, invitations: { select: { providerOrgId: true } } },
  });
  const invited = req.invitations.map((i) => i.providerOrgId);
  if (req.visibility === "INVITED") return notifyInvited(requestId, invited);
  const providers = await db.organization.findMany({
    where: {
      id: { notIn: [req.requesterOrgId, ...invited] },
      status: "ACTIVE",
      capabilities: { some: { capability: "TRANSPORT_PROVIDER", status: "VERIFIED" } },
    },
    select: orgSelect,
  });
  const price = req.priceCents ? formatCents(req.priceCents) : "–";
  await sendAll(
    providers.map((p) =>
      mail(p, req, "Neuer Auftrag {route}", [
        "Neuer Auftrag in der Börse: {route}, Abholung {pickup}.",
        req.priceMode === "FIXED" ? "Festpreis: {price}. Das erste Unternehmen, das übernimmt, erhält den Auftrag." : "Richtpreis: {price}. Angebote sind möglich.",
        "{pax} Personen, Auftraggeber: {requester}.",
      ], { price, pax: req.passengers, requester: req.requesterOrg.name }),
    ),
  );
  if (invited.length) await notifyInvited(requestId, invited);
}

/** Gezielte Angebotsanfrage: an die eingeladenen Unternehmen. */
export async function notifyInvited(requestId: string, orgIds: string[]) {
  if (orgIds.length === 0) return;
  const req = await db.transferRequest.findUniqueOrThrow({ where: { id: requestId }, include: { requesterOrg: { select: orgSelect } } });
  const orgs = await db.organization.findMany({ where: { id: { in: orgIds }, status: "ACTIVE" }, select: orgSelect });
  const price = req.priceCents ? formatCents(req.priceCents) : "–";
  await sendAll(
    orgs.map((p) =>
      mail(p, req, "Direktanfrage von {requester}: {route}", [
        "{requester} bittet Sie gezielt um ein Angebot: {route}, Abholung {pickup}.",
        req.priceMode === "FIXED" ? "Festpreis: {price}. Das erste Unternehmen, das übernimmt, erhält den Auftrag." : "Richtpreis: {price}. Angebote sind möglich.",
        "{pax} Personen. Sie können die Anfrage in Transferborsa annehmen oder ablehnen.",
      ], { price, pax: req.passengers, requester: req.requesterOrg.name }),
    ),
  );
}

/** Neues oder geändertes Angebot: an den Auftraggeber. */
export async function notifyQuoteSubmitted(quoteId: string) {
  const q = await db.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: { providerOrg: { select: { name: true } }, request: { include: { requesterOrg: { select: orgSelect } } } },
  });
  await sendAll([
    mail(q.request.requesterOrg, q.request, "Neues Angebot für {ref}", [
      "{provider} bietet {amount} für {route} (Abholung {pickup}).",
      "Sie können das Angebot in Transferborsa vergleichen und annehmen.",
    ], { provider: q.providerOrg.name, amount: formatCents(q.amountCents) }),
  ]);
}

/** Verbindliche Buchung: an beide Seiten. */
export async function notifyBooked(bookingId: string) {
  const b = await db.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { request: true, providerOrg: { select: orgSelect }, requesterOrg: { select: orgSelect } },
  });
  const vars = { amount: formatCents(b.agreedPriceCents), provider: b.providerOrg.name, requester: b.requesterOrg.name };
  await sendAll([
    mail(b.providerOrg, b.request, "Auftrag {ref} verbindlich vergeben", [
      "Sie fahren {route} am {pickup} für {amount}.",
      "Auftraggeber: {requester}. Adressen und Fahrgastdaten finden Sie jetzt in der Buchung.",
    ], vars),
    mail(b.requesterOrg, b.request, "Buchung {ref} bestätigt", [
      "{provider} fährt {route} am {pickup} für {amount}. Der Preis ist verbindlich.",
    ], vars),
  ]);
}

const STATUS_WORD: Record<string, string> = {
  "booking.cancelled": "storniert",
  "booking.disputed": "beanstandet",
  "booking.completed": "durchgeführt",
};

const STATUS_SUBJECT: Record<string, string> = {
  "booking.cancelled": "Buchung {ref} storniert",
  "booking.disputed": "Problem gemeldet zu {ref}",
  "booking.completed": "Fahrt {ref} durchgeführt",
};

/** Storno, Beanstandung oder Abschluss: an die jeweils andere Seite. */
export async function notifyBookingStatus(bookingId: string, eventType: string, actorOrgId: string, note?: string) {
  const subject = STATUS_SUBJECT[eventType];
  if (!subject) return;
  const b = await db.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { request: true, providerOrg: { select: orgSelect }, requesterOrg: { select: orgSelect } },
  });
  const [actor, other] = actorOrgId === b.providerOrgId ? [b.providerOrg, b.requesterOrg] : [b.requesterOrg, b.providerOrg];
  await sendAll([
    mail(other, b.request, subject, [
      "{actor} hat den Status der Buchung {ref} ({route}, {pickup}) geändert: {status}.",
      ...(note ? ["Begründung: {note}"] : []),
    ], { actor: actor.name, status: makeT(localeOf(other.country))(STATUS_WORD[eventType]), note: note ?? "" }),
  ]);
}

/** Zurückgezogener Auftrag: an Unternehmen, die ein Angebot abgegeben hatten. */
export async function notifyRequestCancelled(requestId: string) {
  const req = await db.transferRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: { quotes: { include: { providerOrg: { select: orgSelect } } } },
  });
  await sendAll(
    req.quotes.map((q) => mail(q.providerOrg, req, "Auftrag {ref} zurückgezogen", [
      "Der Auftraggeber hat {route} ({pickup}) zurückgezogen. Ihr Angebot ist damit hinfällig.",
    ])),
  );
}

/** Benachrichtigungen sind nachrangig: ein Fehler darf die bereits gespeicherte Aktion nicht als gescheitert melden. */
export function notificationFailed(e: unknown) {
  console.error("Benachrichtigung fehlgeschlagen", e);
}
