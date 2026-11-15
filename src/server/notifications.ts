/**
 * E-Mail-Benachrichtigungen zu Aufträgen und Buchungen. Empfänger ist die geschäftliche
 * E-Mail-Adresse der jeweiligen Organisation. Die Sprache richtet sich nach dem Land der
 * Organisation (deutschsprachige Länder Deutsch, sonst Englisch).
 *
 * Jede Benachrichtigung geht zusätzlich als Mitteilung an die Geräte des Unternehmens, auf denen
 * Mitteilungen eingeschaltet sind (siehe push.ts). Neue Festpreis-Aufträge lassen sich direkt aus
 * der Mitteilung übernehmen.
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
import { sendPushes, type PushMessage } from "./push";
import { referenceOf } from "./services/marketplace";

type Org = { id: string; email: string; name: string; country: string };

/** Eine Benachrichtigung an ein Unternehmen: E-Mail (falls gewünscht) und Mitteilung aufs Gerät. */
type Note = { email: Email | null; push: { orgId: string; message: PushMessage } };

const localeOf = (country: string): Locale => (["AT", "DE", "CH", "LI"].includes(country) ? "de" : "en");

type Req = { id: string; number: number; pickupPlaceId: string; dropoffPlaceId: string; pickupAt: Date };

type Opts = { vars?: Record<string, string | number>; /** Kurztext der Mitteilung; sonst die erste Zeile */ pushBody?: string; takeable?: boolean; email?: boolean };

function note(org: Org, req: Req, subject: string, lines: string[], opts: Opts = {}): Note {
  const locale = localeOf(org.country);
  const t = makeT(locale);
  const v = {
    ref: referenceOf(req.number),
    route: `${t(placeName(req.pickupPlaceId))} → ${t(placeName(req.dropoffPlaceId))}`,
    pickup: fmtDateTime(req.pickupAt, locale),
    ...opts.vars,
  };
  const path = `/boerse/auftrag/${req.id}`;
  return {
    email: opts.email === false ? null : {
      to: org.email,
      subject: `Transferborsa: ${t(subject, v)}`,
      text: [
        ...lines.map((l) => t(l, v)),
        "",
        appUrl(path),
        "",
        "—",
        t("Diese Nachricht wurde automatisch von Transferborsa verschickt."),
      ].join("\n"),
    },
    push: {
      orgId: org.id,
      message: {
        title: t(subject, v),
        body: t(opts.pushBody ?? lines[0], v),
        url: path,
        tag: `${subject}:${req.id}`,
        ...(opts.takeable
          ? { takeRequestId: req.id, actions: [{ action: "take" as const, title: t("Übernehmen") }, { action: "open" as const, title: t("Ansehen") }] }
          : {}),
      },
    },
  };
}

async function deliver(notes: Note[]) {
  await Promise.all([sendAll(notes.flatMap((n) => (n.email ? [n.email] : []))), sendPushes(notes.map((n) => n.push))]);
}

const orgSelect = { id: true, email: true, name: true, country: true } as const;

/**
 * Neuer Auftrag: eingeladene Unternehmen erhalten eine Direktanfrage. Börsenaufträge gehen zusätzlich
 * an alle übrigen geprüften, aktiven Beförderungsunternehmen außer dem Auftraggeber.
 */
export async function notifyNewRequest(requestId: string, skipOrgIds: string[] = []) {
  const req = await db.transferRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: { requesterOrg: { select: orgSelect }, invitations: { select: { providerOrgId: true } } },
  });
  const invited = req.invitations.map((i) => i.providerOrgId);
  if (req.visibility === "INVITED") return notifyInvited(requestId, invited);
  // Stufe 1: nur der eigene Betrieb, kein Versand. Stufe 2: nur die Partner des Auftraggebers.
  if (req.audience === "OWN") return;
  const partnerIds =
    req.audience === "PARTNERS"
      ? (await db.partnerLink.findMany({ where: { orgId: req.requesterOrgId }, select: { partnerOrgId: true } })).map((l) => l.partnerOrgId)
      : null;
  const providers = await db.organization.findMany({
    where: {
      id: { notIn: [req.requesterOrgId, ...invited, ...skipOrgIds], ...(partnerIds ? { in: partnerIds } : {}) },
      // Suchagent: nur wer keine Strecke gespeichert hat oder wessen gespeicherte Strecke passt. E-Mail nur, wer sie will; Mitteilungen aufs Gerät immer.
      OR: [
        { jobAlerts: { none: {} } },
        { jobAlerts: { some: { AND: [{ OR: [{ fromPlaceId: null }, { fromPlaceId: req.pickupPlaceId }] }, { OR: [{ toPlaceId: null }, { toPlaceId: req.dropoffPlaceId }] }] } } },
      ],
      status: "ACTIVE",
      capabilities: { some: { capability: "TRANSPORT_PROVIDER", status: "VERIFIED" } },
    },
    select: { ...orgSelect, mailNewJobs: true },
  });
  const price = req.priceCents ? formatCents(req.priceCents) : "–";
  const takeable = req.priceMode === "FIXED" && req.priceCents != null;
  await deliver(
    providers.map((p) =>
      note(p, req, "Neuer Auftrag {route}", [
        "Neuer Auftrag in der Börse: {route}, Abholung {pickup}.",
        req.priceMode === "FIXED" ? "Festpreis: {price}. Das erste Unternehmen, das übernimmt, erhält den Auftrag." : "Richtpreis: {price}. Angebote sind möglich.",
        ...(req.handoffSharePercent > 0 ? ["{requester} behält {share} % vom Fahrpreis als Abgabe-Anteil."] : []),
        "{pax} Personen, Auftraggeber: {requester}.",
      ], {
        vars: { price, pax: req.passengers, requester: req.requesterOrg.name, share: req.handoffSharePercent },
        pushBody: takeable ? "{pickup} · {pax} Personen · Festpreis {price}" : "{pickup} · {pax} Personen · Richtpreis {price}",
        takeable,
        email: p.mailNewJobs,
      }),
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
  const takeable = req.priceMode === "FIXED" && req.priceCents != null;
  await deliver(
    orgs.map((p) =>
      note(p, req, "Direktanfrage von {requester}: {route}", [
        "{requester} bittet Sie gezielt um ein Angebot: {route}, Abholung {pickup}.",
        req.priceMode === "FIXED" ? "Festpreis: {price}. Das erste Unternehmen, das übernimmt, erhält den Auftrag." : "Richtpreis: {price}. Angebote sind möglich.",
        ...(req.handoffSharePercent > 0 ? ["{requester} behält {share} % vom Fahrpreis als Abgabe-Anteil."] : []),
        "{pax} Personen. Sie können die Anfrage in Transferborsa annehmen oder ablehnen.",
      ], {
        vars: { price, pax: req.passengers, requester: req.requesterOrg.name, share: req.handoffSharePercent },
        pushBody: takeable ? "{pickup} · {pax} Personen · Festpreis {price}" : "{pickup} · {pax} Personen · Richtpreis {price}",
        takeable,
      }),
    ),
  );
}

/** Neues oder geändertes Angebot: an den Auftraggeber. */
export async function notifyQuoteSubmitted(quoteId: string) {
  const q = await db.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: { providerOrg: { select: { name: true } }, request: { include: { requesterOrg: { select: orgSelect } } } },
  });
  await deliver([
    note(q.request.requesterOrg, q.request, "Neues Angebot für {ref}", [
      "{provider} bietet {amount} für {route} (Abholung {pickup}).",
      "Sie können das Angebot in Transferborsa vergleichen und annehmen.",
    ], { vars: { provider: q.providerOrg.name, amount: formatCents(q.amountCents) } }),
  ]);
}

/** Verbindliche Buchung: an beide Seiten. */
export async function notifyBooked(bookingId: string) {
  const b = await db.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { request: true, providerOrg: { select: orgSelect }, requesterOrg: { select: orgSelect } },
  });
  const vars = {
    amount: formatCents(b.agreedPriceCents), provider: b.providerOrg.name, requester: b.requesterOrg.name,
    share: b.handoffSharePercent, shareAmount: formatCents(b.handoffShareCents), net: formatCents(b.agreedPriceCents - b.handoffShareCents),
  };
  const hasShare = b.handoffShareCents > 0;
  await deliver([
    note(b.providerOrg, b.request, "Auftrag {ref} verbindlich vergeben", [
      "Sie fahren {route} am {pickup} für {amount}.",
      ...(hasShare ? ["Davon behält {requester} {shareAmount} ({share} %) als Abgabe-Anteil, Sie erhalten {net}."] : []),
      "Auftraggeber: {requester}. Adressen und Fahrgastdaten finden Sie jetzt in der Buchung.",
    ], { vars }),
    note(b.requesterOrg, b.request, "Buchung {ref} bestätigt", [
      "{provider} fährt {route} am {pickup} für {amount}. Der Preis ist verbindlich.",
      ...(hasShare ? ["Ihr Abgabe-Anteil: {shareAmount} ({share} %). {provider} erhält {net}."] : []),
    ], { vars }),
  ]);
}

const STATUS_WORD: Record<string, string> = {
  "booking.cancelled": "storniert",
  "booking.disputed": "beanstandet",
  "booking.completed": "durchgeführt",
  "booking.no_show": "Fahrgast nicht erschienen",
};

const STATUS_SUBJECT: Record<string, string> = {
  "booking.cancelled": "Buchung {ref} storniert",
  "booking.disputed": "Problem gemeldet zu {ref}",
  "booking.completed": "Fahrt {ref} durchgeführt",
  "booking.no_show": "Fahrgast nicht erschienen: {ref}",
};

/** Storno, Beanstandung oder Abschluss: an die jeweils andere Seite. */
export async function notifyBookingStatus(bookingId: string, eventType: string, actorOrgId: string, reason?: string, feeCents?: number) {
  const subject = STATUS_SUBJECT[eventType];
  if (!subject) return;
  const b = await db.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { request: true, providerOrg: { select: orgSelect }, requesterOrg: { select: orgSelect } },
  });
  const [actor, other] = actorOrgId === b.providerOrgId ? [b.providerOrg, b.requesterOrg] : [b.requesterOrg, b.providerOrg];
  await deliver([
    note(other, b.request, subject, [
      "{actor} hat den Status der Buchung {ref} ({route}, {pickup}) geändert: {status}.",
      ...(reason ? ["Begründung: {note}"] : []),
      ...(feeCents ? ["Laut vereinbarter Stornoregel fällt eine Gebühr von {fee} an. Sie wird direkt zwischen den Unternehmen abgerechnet."] : []),
    ], {
      vars: {
        actor: actor.name,
        status: makeT(localeOf(other.country))(STATUS_WORD[eventType]),
        note: reason ?? "",
        fee: feeCents ? new Intl.NumberFormat(localeOf(other.country) === "en" ? "en-GB" : "de-AT", { style: "currency", currency: b.currency }).format(feeCents / 100) : "",
      },
    }),
  ]);
}

/** Neue Nachricht zum Auftrag: an die andere Seite. Der Text steht nur in der App. */
export async function notifyNewMessage(messageId: string) {
  const m = await db.message.findUniqueOrThrow({
    where: { id: messageId },
    include: { request: true, senderOrg: { select: orgSelect }, threadOrg: { select: orgSelect } },
  });
  const to = m.senderOrgId === m.threadOrgId ? await db.organization.findUniqueOrThrow({ where: { id: m.request.requesterOrgId }, select: orgSelect }) : m.threadOrg;
  await deliver([
    note(to, m.request, "Neue Nachricht zu {ref}", ["{actor} hat Ihnen zum Auftrag {ref} ({route}, {pickup}) geschrieben. Die Nachricht lesen und antworten Sie in Transferborsa."], { vars: { actor: m.senderOrg.name } }),
  ]);
}

/** Das ausführende Unternehmen hat einen übernommenen Auftrag zurückgegeben: an den Auftraggeber. */
export async function notifyBookingReturned(requestId: string, providerOrgId: string, reason: string) {
  const req = await db.transferRequest.findUniqueOrThrow({ where: { id: requestId }, include: { requesterOrg: { select: orgSelect } } });
  const provider = await db.organization.findUniqueOrThrow({ where: { id: providerOrgId }, select: orgSelect });
  await deliver([
    note(req.requesterOrg, req, "Auftrag {ref} zurückgegeben", [
      "{actor} hat den übernommenen Auftrag {ref} ({route}, {pickup}) zurückgegeben. Er ist wieder offen und wird neu veröffentlicht.",
      "Begründung: {note}",
    ], { vars: { actor: provider.name, note: reason } }),
  ]);
}

/** Zurückgezogener Auftrag: an Unternehmen, die ein Angebot abgegeben hatten. */
export async function notifyRequestCancelled(requestId: string) {
  const req = await db.transferRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: { quotes: { include: { providerOrg: { select: orgSelect } } } },
  });
  await deliver(
    req.quotes.map((q) => note(q.providerOrg, req, "Auftrag {ref} zurückgezogen", [
      "Der Auftraggeber hat {route} ({pickup}) zurückgezogen. Ihr Angebot ist damit hinfällig.",
    ])),
  );
}

/** Die Disposition hat einem Fahrer eine Fahrt zugewiesen: Mitteilung nur an dessen Geräte (keine E-Mail). */
export async function notifyDriverAssigned(bookingId: string) {
  const b = await db.booking.findUniqueOrThrow({ where: { id: bookingId }, include: { request: true, providerOrg: { select: orgSelect } } });
  if (!b.driverId) return;
  const n = note(b.providerOrg, b.request, "Neue Fahrt für Sie: {route}", ["Abholung {pickup}. Details stehen unter „Meine Fahrten“."], { email: false });
  await sendPushes([{ ...n.push, userIds: [b.driverId], message: { ...n.push.message, url: "/fahrer" } }]);
}

/** Benachrichtigungen sind nachrangig: ein Fehler darf die bereits gespeicherte Aktion nicht als gescheitert melden. */
export function notificationFailed(e: unknown) {
  console.error("Benachrichtigung fehlgeschlagen", e);
}
