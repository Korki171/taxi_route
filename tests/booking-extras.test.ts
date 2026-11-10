import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createTransferRequest, searchBoard, takeFixedPriceRequest } from "@/server/services/marketplace";
import { getBookingDocumentForDownload, listBookingDocuments, returnBooking, uploadBookingDocument } from "@/server/services/booking-extras";
import { PDF, requestInput, verifiedAgency, verifiedTaxi } from "./helpers";

async function booked() {
  const agency = await verifiedAgency("Reisebüro A");
  const taxi = await verifiedTaxi("Taxi B");
  const other = await verifiedTaxi("Taxi C");
  const req = await createTransferRequest(agency.actor, requestInput({ priceMode: "FIXED" }));
  const booking = await takeFixedPriceRequest(taxi.actor, req.id);
  return { agency, taxi, other, req, booking };
}

describe("Auftrag zurückgeben", () => {
  it("Buchung entfällt, Auftrag ist wieder offen und für andere sichtbar", async () => {
    const { taxi, other, req, booking } = await booked();
    await expect(returnBooking(taxi.actor, booking.id, " ")).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(returnBooking(other.actor, booking.id, "Fahrzeug defekt")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await searchBoard(other.actor, {})).toEqual([]);
    await returnBooking(taxi.actor, booking.id, "Fahrzeug defekt");
    expect(await db.booking.count({ where: { id: booking.id } })).toBe(0);
    expect((await db.transferRequest.findUniqueOrThrow({ where: { id: req.id } })).status).toBe("OPEN");
    expect((await searchBoard(other.actor, {})).map((r) => r.id)).toEqual([req.id]);
    const ev = await db.transferEvent.findFirstOrThrow({ where: { requestId: req.id, type: "booking.returned" } });
    expect(ev.data).toMatchObject({ note: "Fahrzeug defekt" });
    // erneut übernehmbar
    const again = await takeFixedPriceRequest(other.actor, req.id);
    expect(again.providerOrgId).toBe(other.org.id);
  });

  it("nur der Auftraggeber darf nicht zurückgeben", async () => {
    const { agency, booking } = await booked();
    await expect(returnBooking(agency.actor, booking.id, "x")).rejects.toBeTruthy();
  });
});

describe("Dokumente zur Buchung", () => {
  it("beide Seiten laden hoch und sehen sie, Dritte nicht", async () => {
    const { agency, taxi, other, booking } = await booked();
    const file = { name: "voucher.pdf", mimeType: "application/pdf", bytes: PDF };
    const doc = await uploadBookingDocument(agency.actor, booking.id, "Voucher", file);
    await uploadBookingDocument(taxi.actor, booking.id, "Beleg", file);
    expect((await listBookingDocuments(taxi.actor, booking.id)).map((d) => d.title)).toEqual(["Voucher", "Beleg"]);
    expect((await getBookingDocumentForDownload(taxi.actor, doc.id)).fileName).toBe("voucher.pdf");
    await expect(getBookingDocumentForDownload(other.actor, doc.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(uploadBookingDocument(other.actor, booking.id, "X", file)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(uploadBookingDocument(taxi.actor, booking.id, "Falsch", { name: "a.pdf", mimeType: "application/pdf", bytes: new Uint8Array([1, 2, 3, 4]) })).rejects.toMatchObject({ code: "VALIDATION" });
  });
});
