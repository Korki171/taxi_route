import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { MAX_HANDOFF_SHARE_PERCENT, splitHandoff } from "@/lib/handoff";
import { renderConfirmationPdf } from "@/server/pdf/confirmation";
import { getBookingConfirmation } from "@/server/services/confirmation";
import { acceptQuote, createTransferRequest, searchBoard, submitQuote, takeFixedPriceRequest } from "@/server/services/marketplace";
import { requestInput, verifiedAgency, verifiedTaxi } from "./helpers";

describe("Abgabe-Anteil", () => {
  it("teilt den Fahrpreis auf ganze Cent", () => {
    expect(splitHandoff(18000, 10)).toEqual({ priceCents: 18000, percent: 10, shareCents: 1800, providerCents: 16200 });
    expect(splitHandoff(24550, 7)).toEqual({ priceCents: 24550, percent: 7, shareCents: 1719, providerCents: 22831 });
    expect(splitHandoff(18000, 0).shareCents).toBe(0);
    const s = splitHandoff(9999, 15);
    expect(s.shareCents + s.providerCents).toBe(9999);
  });

  it("ohne Angabe kein Anteil", async () => {
    const a = await verifiedTaxi();
    const b = await verifiedTaxi();
    const req = await createTransferRequest(a.actor, requestInput({ priceMode: "FIXED", priceCents: 20000 }));
    expect(req.handoffSharePercent).toBe(0);
    const booking = await takeFixedPriceRequest(b.actor, req.id);
    expect(booking).toMatchObject({ agreedPriceCents: 20000, handoffSharePercent: 0, handoffShareCents: 0 });
  });

  it("Festpreis: Übernehmer sieht den Anteil, Buchung hält ihn fest", async () => {
    const a = await verifiedTaxi("Taxi Innsbruck");
    const b = await verifiedTaxi("Taxi Schwaz");
    const req = await createTransferRequest(a.actor, requestInput({ priceMode: "FIXED", priceCents: 18000, handoffSharePercent: "10" }));
    expect(req.handoffSharePercent).toBe(10);
    const [listed] = await searchBoard(b.actor, {});
    expect(listed.handoffSharePercent).toBe(10);

    const booking = await takeFixedPriceRequest(b.actor, req.id);
    expect(booking).toMatchObject({ agreedPriceCents: 18000, handoffSharePercent: 10, handoffShareCents: 1800 });

    // Spätere Änderungen am Auftrag ändern die Buchung nicht
    await db.transferRequest.update({ where: { id: req.id }, data: { handoffSharePercent: 15 } });
    expect((await db.booking.findUniqueOrThrow({ where: { id: booking.id } })).handoffShareCents).toBe(1800);

    const event = await db.transferEvent.findFirstOrThrow({ where: { requestId: req.id, type: "booking.fixed_price_taken" } });
    expect(event.data).toMatchObject({ agreedPriceCents: 18000, handoffShareCents: 1800 });
  });

  it("Angebot: Anteil wird vom angenommenen Preis berechnet", async () => {
    const agency = await verifiedAgency();
    const taxi = await verifiedTaxi();
    const req = await createTransferRequest(agency.actor, requestInput({ handoffSharePercent: 5 }));
    const quote = await submitQuote(taxi.actor, req.id, { amountCents: 22500, vehicleCategory: "VAN" });
    const booking = await acceptQuote(agency.actor, quote.id);
    expect(booking).toMatchObject({ agreedPriceCents: 22500, handoffSharePercent: 5, handoffShareCents: 1125 });
  });

  it("lehnt ungültige Anteile ab", async () => {
    const a = await verifiedTaxi();
    for (const handoffSharePercent of [MAX_HANDOFF_SHARE_PERCENT + 1, -1, 7.5, "abc"]) {
      await expect(createTransferRequest(a.actor, requestInput({ priceMode: "FIXED", priceCents: 20000, handoffSharePercent })))
        .rejects.toMatchObject({ code: "VALIDATION" });
    }
  });

  it("Auftragsbestätigung (PDF) mit Anteil in beiden Sprachen", async () => {
    const a = await verifiedTaxi();
    const b = await verifiedTaxi();
    const req = await createTransferRequest(a.actor, requestInput({ priceMode: "FIXED", priceCents: 18000, handoffSharePercent: 10 }));
    const booking = await takeFixedPriceRequest(b.actor, req.id);
    for (const actor of [a.actor, b.actor]) {
      const data = await getBookingConfirmation(actor, booking.id);
      expect(data.booking.handoffShareCents).toBe(1800);
      for (const locale of ["de", "en"] as const) {
        const pdf = await renderConfirmationPdf(data, locale);
        expect(Buffer.from(pdf.slice(0, 5)).toString()).toBe("%PDF-");
      }
    }
  });
});
