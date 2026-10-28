import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { VehicleCategory } from "@prisma/client";
import { fmtDate, fmtMinutes, fmtTime } from "@/lib/format";
import { makeT, type Locale } from "@/lib/i18n";
import { BOOKING_STATUS_LABEL, VEHICLE_LABEL } from "@/lib/labels";
import { formatCents } from "@/lib/money";
import { placeName } from "@/lib/places";
import { bookingReference, type BookingConfirmation } from "../services/confirmation";
import { referenceOf } from "../services/marketplace";

// Farben wie in der App (globals.css)
const NAVY = rgb(0x1f / 255, 0x2b / 255, 0x4d / 255);
const MUTED = rgb(0x55 / 255, 0x5d / 255, 0x72 / 255);
const ORANGE = rgb(0xf7 / 255, 0x94 / 255, 0x1d / 255);
const SURFACE = rgb(0xf4 / 255, 0xf4 / 255, 0xf2 / 255);
const RULE = rgb(0xe3 / 255, 0xe1 / 255, 0xdc / 255);
const WHITE = rgb(1, 1, 1);

const W = 595.28;
const H = 841.89;
const M = 48;

/** Zeichen, die die Standardschrift (WinAnsi) nicht kennt, durch lesbare Entsprechungen ersetzen. */
const SUBSTITUTE: Record<string, string> = { "→": "->", " ": " ", " ": " ", "≈": "~", "±": "+/-" };

class Writer {
  page!: PDFPage;
  y = 0;
  pages: PDFPage[] = [];
  private known = new Map<string, boolean>();

  constructor(private doc: PDFDocument, readonly regular: PDFFont, readonly bold: PDFFont) {}

  safe(text: string) {
    let out = "";
    for (const ch of text) {
      const sub = SUBSTITUTE[ch];
      if (sub !== undefined) { out += sub; continue; }
      let ok = this.known.get(ch);
      if (ok === undefined) {
        try { this.regular.encodeText(ch); ok = true; } catch { ok = false; }
        this.known.set(ch, ok);
      }
      out += ok ? ch : "?";
    }
    return out;
  }

  newPage() {
    this.page = this.doc.addPage([W, H]);
    this.pages.push(this.page);
    this.y = H - M;
  }

  ensure(space: number) {
    if (this.y - space < 72) this.newPage();
  }

  /** Bricht Text auf die Breite um und gibt die Zeilen zurück. */
  wrap(text: string, font: PDFFont, size: number, width: number) {
    const lines: string[] = [];
    for (const para of this.safe(text).split("\n")) {
      let line = "";
      for (const word of para.split(/\s+/)) {
        const next = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(next, size) > width && line) {
          lines.push(line);
          line = word;
        } else line = next;
      }
      lines.push(line);
    }
    return lines;
  }

  text(text: string, x: number, y: number, opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb> } = {}) {
    this.page.drawText(this.safe(text), { x, y, font: opts.font ?? this.regular, size: opts.size ?? 10, color: opts.color ?? NAVY });
  }
}

/** Erstellt die Auftragsbestätigung als PDF (A4) in der Sprache des Nutzers. */
export async function renderConfirmationPdf(data: BookingConfirmation, locale: Locale): Promise<Uint8Array> {
  const t = makeT(locale);
  // In der Bestätigung immer mit Jahr
  const full = (d: Date) => `${fmtDate(d, locale)}, ${fmtTime(d, locale)}`;
  const { booking: b, request: r, role } = data;
  const doc = await PDFDocument.create();
  const ref = bookingReference(r.number);
  doc.setTitle(`${t("Auftragsbestätigung")} ${ref}`);
  doc.setAuthor("Transferborsa");
  doc.setCreator("Transferborsa");
  doc.setLanguage(locale === "en" ? "en-GB" : "de-AT");
  const w = new Writer(doc, await doc.embedFont(StandardFonts.Helvetica), await doc.embedFont(StandardFonts.HelveticaBold));
  w.newPage();

  // Kopf: Navy-Band mit Wortmarke, orange Linie
  w.page.drawRectangle({ x: 0, y: H - 88, width: W, height: 88, color: NAVY });
  w.page.drawRectangle({ x: 0, y: H - 92, width: W, height: 4, color: ORANGE });
  w.text("TRANSFERBORSA", M, H - 52, { font: w.bold, size: 18, color: WHITE });
  const tagline = t("B2B-Auftragsbörse für Taxi-/Transferunternehmen und Reisebüros");
  w.text(tagline, M, H - 70, { size: 8.5, color: rgb(0xc4 / 255, 0xca / 255, 0xd8 / 255) });

  w.y = H - 136;
  w.text(t("Auftragsbestätigung").toUpperCase(), M, w.y, { font: w.bold, size: 20 });
  const status = t(BOOKING_STATUS_LABEL[b.status]);
  const statusWidth = w.bold.widthOfTextAtSize(w.safe(status), 9) + 16;
  w.page.drawRectangle({ x: W - M - statusWidth, y: w.y - 4, width: statusWidth, height: 18, color: b.status === "CANCELLED" || b.status === "DISPUTED" ? rgb(0xfd / 255, 0xe6 / 255, 0xe2 / 255) : rgb(0xdc / 255, 0xf3 / 255, 0xe3 / 255) });
  w.text(status, W - M - statusWidth + 8, w.y + 1.5, { font: w.bold, size: 9, color: b.status === "CANCELLED" || b.status === "DISPUTED" ? rgb(0x9b / 255, 0x1c / 255, 0x14 / 255) : rgb(0x14 / 255, 0x5c / 255, 0x32 / 255) });
  w.y -= 20;
  w.text(`${t("Buchung")} ${ref} · ${t("Auftrag")} ${referenceOf(r.number)} · ${t("Ausgestellt am {date}", { date: fmtDate(new Date(), locale) })}`, M, w.y, { size: 10, color: MUTED });
  w.y -= 30;

  // Parteien nebeneinander
  const colW = (W - 2 * M - 24) / 2;
  const party = (title: string, o: typeof b.requesterOrg, extra: string[], x: number) => {
    let y = w.y;
    w.text(title.toUpperCase(), x, y, { font: w.bold, size: 8, color: MUTED });
    y -= 16;
    const lines = [
      ...w.wrap(o.legalName || o.name, w.bold, 11, colW).map((l) => ({ l, bold: true })),
      ...(o.legalName && o.legalName !== o.name ? [{ l: o.name, bold: false }] : []),
      { l: o.street, bold: false },
      { l: `${o.postalCode} ${o.city}, ${o.country}`, bold: false },
      { l: `${t("Telefon")}: ${o.phone}`, bold: false },
      { l: `${t("E-Mail")}: ${o.email}`, bold: false },
      ...(o.vatId ? [{ l: `${t("UID-Nummer")}: ${o.vatId}`, bold: false }] : []),
      ...extra.map((l) => ({ l, bold: false })),
    ];
    for (const { l, bold } of lines) {
      w.text(l, x, y, { font: bold ? w.bold : w.regular, size: bold ? 11 : 9.5 });
      y -= bold ? 15 : 13;
    }
    return y;
  };
  const concession = b.providerOrg.transportProfile?.concessionNumber;
  const yA = party(t("Auftraggeber"), b.requesterOrg, [], M);
  const yB = party(t("Ausführendes Unternehmen"), b.providerOrg, concession ? [`${t("Konzession")}: ${concession}`] : [], M + colW + 24);
  w.y = Math.min(yA, yB) - 14;

  // Fahrt
  const scope = (b.scope ?? {}) as { vehicleCategory?: VehicleCategory | null };
  const category = scope.vehicleCategory ?? r.vehicleCategory;
  const rows: [string, string][] = [
    [t("Abholung"), `${full(r.pickupAt)}${r.pickupWindowMinutes ? ` (+/- ${r.pickupWindowMinutes} min)` : ""}`],
    [t("Von"), [t(placeName(r.pickupPlaceId)), r.pickupAddress].filter(Boolean).join(", ")],
    [t("Nach"), [t(placeName(r.dropoffPlaceId)), r.dropoffAddress].filter(Boolean).join(", ")],
    [t("Fahrzeit"), t("ca. {n}", { n: fmtMinutes(r.estimatedMinutes) })],
  ];
  if (r.flightNumber) rows.push([t("Flug"), `${r.flightNumber}${r.flightArrivalAt ? `, ${t("Landung")} ${fmtTime(r.flightArrivalAt, locale)}` : ""}`]);
  rows.push([t("Fahrgäste"), `${t("{p} Pers. · {l} Gep.", { p: r.passengers, l: r.luggage })}${r.skiEquipment ? ` · ${t("{n} Ski", { n: r.skiEquipment })}` : ""}`]);
  if (r.childSeats) rows.push([t("Kindersitze"), String(r.childSeats)]);
  if (r.specialLuggage) rows.push([t("Sondergepäck"), r.specialLuggage]);
  rows.push([t("Fahrzeugkategorie"), category ? t(VEHICLE_LABEL[category]) : t("beliebig, passend zur Gruppe")]);
  if (b.vehicle) rows.push([t("Fahrzeug"), `${b.vehicle.label}${b.vehicle.licensePlate ? ` (${b.vehicle.licensePlate})` : ""}`]);
  if (b.driver) rows.push([t("Fahrer"), b.driver.name]);
  if (r.requirements) rows.push([t("Anforderungen"), r.requirements]);
  if (r.pickupNotes) rows.push([t("Hinweise zur Abholung"), r.pickupNotes]);
  for (const c of r.passengersContact) rows.push([t("Fahrgast"), `${c.name}${c.phone ? `, ${c.phone}` : ""}`]);
  if (r.clientReference) rows.push([t("Ihre Referenz"), r.clientReference]);

  const section = (title: string) => {
    w.ensure(40);
    w.text(title.toUpperCase(), M, w.y, { font: w.bold, size: 8, color: MUTED });
    w.y -= 8;
    w.page.drawLine({ start: { x: M, y: w.y }, end: { x: W - M, y: w.y }, thickness: 0.75, color: RULE });
    w.y -= 16;
  };
  const kv = (rowsToDraw: [string, string][]) => {
    const keyW = 140;
    for (const [k, v] of rowsToDraw) {
      const lines = w.wrap(v, w.regular, 10, W - 2 * M - keyW);
      w.ensure(lines.length * 13 + 6);
      w.text(k, M, w.y, { size: 9.5, color: MUTED });
      lines.forEach((l, i) => w.text(l, M + keyW, w.y - i * 13, { size: 10 }));
      w.y -= lines.length * 13 + 6;
    }
  };

  section(t("Leistung"));
  kv(rows);
  w.y -= 8;

  // Preis
  w.ensure(86);
  const boxH = 72;
  w.page.drawRectangle({ x: M, y: w.y - boxH + 14, width: W - 2 * M, height: boxH, color: SURFACE });
  w.page.drawRectangle({ x: M, y: w.y - boxH + 14, width: 4, height: boxH, color: ORANGE });
  w.text(t("Vereinbarter Preis").toUpperCase(), M + 18, w.y - 4, { font: w.bold, size: 8, color: MUTED });
  w.text(formatCents(b.agreedPriceCents, locale), M + 18, w.y - 30, { font: w.bold, size: 22 });
  const note = w.wrap(t("Der Preis ist verbindlich vereinbart. Die Abrechnung erfolgt direkt zwischen den Unternehmen, Transferborsa wickelt keine Zahlungen ab."), w.regular, 8.5, 250);
  note.forEach((l, i) => w.text(l, W - M - 262, w.y - 8 - i * 11, { size: 8.5, color: MUTED }));
  w.y -= boxH + 12;

  section(t("Bedingungen"));
  kv([
    [t("Buchungsbedingungen"), r.bookingTerms ?? t("keine gesonderten Bedingungen")],
    [t("Stornobedingungen"), b.cancellationTerms ?? t("keine gesonderten Bedingungen")],
    [t("Vereinbart"), `${full(b.acceptedAt)}, ${b.quoteId ? t("durch Annahme eines Angebots") : t("durch Übernahme zum Festpreis")}${data.acceptedByName ? ` (${data.acceptedByName})` : ""}`],
    ...(b.completedAt ? [[t("Abgeschlossen"), full(b.completedAt)] as [string, string]] : []),
  ]);
  w.y -= 4;
  const scopeNote = w.wrap(t("Der Leistungsumfang ist zum Zeitpunkt der Vereinbarung festgehalten und ändert sich nicht mehr."), w.regular, 8.5, W - 2 * M);
  w.ensure(scopeNote.length * 11);
  scopeNote.forEach((l, i) => w.text(l, M, w.y - i * 11, { size: 8.5, color: MUTED }));

  // Fußzeile auf jeder Seite
  const copy = role === "requester" ? t("Exemplar für den Auftraggeber") : t("Exemplar für das ausführende Unternehmen");
  w.pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: 52 }, end: { x: W - M, y: 52 }, thickness: 0.75, color: RULE });
    p.drawText(w.safe(`${t("Erstellt über Transferborsa")} · ${copy} · ${ref}`), { x: M, y: 38, size: 8, font: w.regular, color: MUTED });
    const pn = `${i + 1} / ${w.pages.length}`;
    p.drawText(pn, { x: W - M - w.regular.widthOfTextAtSize(pn, 8), y: 38, size: 8, font: w.regular, color: MUTED });
  });

  return doc.save();
}
