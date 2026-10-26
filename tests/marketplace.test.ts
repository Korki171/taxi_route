import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  acceptQuote,
  cancelBooking,
  cancelTransferRequest,
  completeTrip,
  createTransferRequest,
  disputeBooking,
  getTransferRequest,
  listIncomingQuotes,
  rejectQuote,
  searchBoard,
  startTrip,
  submitQuote,
  takeFixedPriceRequest,
  withdrawQuote,
} from "@/server/services/marketplace";
import { addMember, inHours, register, requestInput, verifiedAgency, verifiedTaxi } from "./helpers";

describe("Szenario A: Taxiunternehmen zu Taxiunternehmen", () => {
  it("Auftrag einstellen, finden, Angebot, Zuschlag, Fahrt durchführen", async () => {
    const a = await verifiedTaxi("Taxi Innsbruck");
    const b = await verifiedTaxi("Taxi Schwaz");
    const req = await createTransferRequest(a.actor, requestInput());
    expect(req.status).toBe("OPEN");
    expect(req.estimatedMinutes).toBeGreaterThan(90);

    const board = await searchBoard(b.actor, {});
    expect(board.map((r) => r.id)).toEqual([req.id]);
    expect(await searchBoard(a.actor, {})).toEqual([]); // eigene Aufträge nicht in der Börse

    const quote = await submitQuote(b.actor, req.id, { amountCents: 22500, vehicleCategory: "VAN", message: "Mit Skibox" });
    expect((await listIncomingQuotes(a.actor)).map((q) => q.id)).toEqual([quote.id]);

    const booking = await acceptQuote(a.actor, quote.id);
    expect(booking).toMatchObject({ agreedPriceCents: 22500, providerOrgId: b.org.id, requesterOrgId: a.org.id, status: "CONFIRMED" });
    expect((booking.scope as { vehicleCategory: string }).vehicleCategory).toBe("VAN");

    await startTrip(b.actor, booking.id);
    await completeTrip(b.actor, booking.id, "Pünktlich übergeben");
    const done = await db.booking.findUniqueOrThrow({ where: { id: booking.id }, include: { request: true } });
    expect(done.status).toBe("COMPLETED");
    expect(done.completedAt).not.toBeNull();
    expect(done.request.status).toBe("COMPLETED");

    const events = await db.transferEvent.findMany({ where: { requestId: req.id }, orderBy: { createdAt: "asc" } });
    expect(events.map((e) => e.type)).toEqual([
      "request.created",
      "quote.submitted",
      "quote.accepted",
      "booking.started",
      "booking.completed",
    ]);
  });

  it("Festpreis direkt übernehmen", async () => {
    const a = await verifiedTaxi();
    const b = await verifiedTaxi();
    const req = await createTransferRequest(a.actor, requestInput({ priceMode: "FIXED", priceCents: 24500 }));
    const booking = await takeFixedPriceRequest(b.actor, req.id);
    expect(booking.agreedPriceCents).toBe(24500);
    expect((await db.transferRequest.findUniqueOrThrow({ where: { id: req.id } })).status).toBe("ASSIGNED");
  });

  it("verhindert doppelte Annahme bei gleichzeitigen Übernahmen", async () => {
    const a = await verifiedTaxi();
    const takers = await Promise.all([verifiedTaxi(), verifiedTaxi(), verifiedTaxi()]);
    const req = await createTransferRequest(a.actor, requestInput({ priceMode: "FIXED", priceCents: 20000 }));
    const results = await Promise.allSettled(takers.map((t) => takeFixedPriceRequest(t.actor, req.id)));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    for (const r of results.filter((r) => r.status === "rejected")) {
      expect((r as PromiseRejectedResult).reason.code).toMatch(/CONFLICT|NOT_FOUND/);
    }
    expect(await db.booking.count({ where: { requestId: req.id } })).toBe(1);
  });

  it("verhandelbarer Auftrag kann nicht zum Festpreis übernommen werden; eigener gar nicht", async () => {
    const a = await verifiedTaxi();
    const b = await verifiedTaxi();
    const req = await createTransferRequest(a.actor, requestInput());
    await expect(takeFixedPriceRequest(b.actor, req.id)).rejects.toMatchObject({ code: "VALIDATION" });
    const fixed = await createTransferRequest(a.actor, requestInput({ priceMode: "FIXED", priceCents: 1000 }));
    await expect(takeFixedPriceRequest(a.actor, fixed.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(submitQuote(a.actor, req.id, { amountCents: 100, vehicleCategory: "SEDAN" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("Annahme eines Angebots lehnt die übrigen ab; zweite Annahme scheitert", async () => {
    const a = await verifiedTaxi();
    const [b, c] = await Promise.all([verifiedTaxi(), verifiedTaxi()]);
    const req = await createTransferRequest(a.actor, requestInput());
    const qb = await submitQuote(b.actor, req.id, { amountCents: 23000, vehicleCategory: "VAN" });
    const qc = await submitQuote(c.actor, req.id, { amountCents: 21000, vehicleCategory: "MINIVAN" });
    await acceptQuote(a.actor, qc.id);
    expect((await db.quote.findUniqueOrThrow({ where: { id: qb.id } })).status).toBe("REJECTED");
    await expect(acceptQuote(a.actor, qb.id)).rejects.toMatchObject({ code: "VALIDATION" });
    // nach Vergabe kein neues Angebot mehr
    await expect(submitQuote(b.actor, req.id, { amountCents: 1, vehicleCategory: "VAN" })).rejects.toBeTruthy();
  });

  it("Angebot zurückziehen, ablehnen und neu abgeben", async () => {
    const a = await verifiedTaxi();
    const b = await verifiedTaxi();
    const req = await createTransferRequest(a.actor, requestInput());
    const q = await submitQuote(b.actor, req.id, { amountCents: 25000, vehicleCategory: "VAN" });
    await withdrawQuote(b.actor, q.id);
    await expect(acceptQuote(a.actor, q.id)).rejects.toMatchObject({ code: "VALIDATION" });
    const q2 = await submitQuote(b.actor, req.id, { amountCents: 24000, vehicleCategory: "VAN" });
    expect(q2.id).toBe(q.id);
    expect(q2.status).toBe("SUBMITTED");
    await rejectQuote(a.actor, q2.id);
    await expect(submitQuote(b.actor, req.id, { amountCents: 23000, vehicleCategory: "VAN" })).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("Angebotsfrist abgelaufen: kein Angebot, nicht mehr in der Börse", async () => {
    const a = await verifiedTaxi();
    const b = await verifiedTaxi();
    const req = await createTransferRequest(a.actor, requestInput({ quoteDeadline: inHours(1).toISOString() }));
    await db.transferRequest.update({ where: { id: req.id }, data: { quoteDeadline: new Date(Date.now() - 1000) } });
    expect(await searchBoard(b.actor, {})).toEqual([]);
    await expect(submitQuote(b.actor, req.id, { amountCents: 20000, vehicleCategory: "VAN" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("zurückgezogener Auftrag verschwindet; Stornierung braucht Grund; Beanstandung möglich", async () => {
    const a = await verifiedTaxi();
    const b = await verifiedTaxi();
    const r1 = await createTransferRequest(a.actor, requestInput());
    await cancelTransferRequest(a.actor, r1.id);
    expect(await searchBoard(b.actor, {})).toEqual([]);

    const r2 = await createTransferRequest(a.actor, requestInput({ priceMode: "FIXED", priceCents: 20000 }));
    const bk = await takeFixedPriceRequest(b.actor, r2.id);
    await expect(cancelBooking(a.actor, bk.id, "  ")).rejects.toMatchObject({ code: "VALIDATION" });
    await disputeBooking(a.actor, bk.id, "Fahrer nicht erschienen");
    expect((await db.transferRequest.findUniqueOrThrow({ where: { id: r2.id } })).status).toBe("DISPUTED");
  });

  it("Validierung: Vergangenheit, gleicher Ort, Festpreis ohne Betrag", async () => {
    const a = await verifiedTaxi();
    await expect(createTransferRequest(a.actor, requestInput({ pickupAt: inHours(-1).toISOString() }))).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(createTransferRequest(a.actor, requestInput({ dropoffPlaceId: "innsbruck" }))).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(createTransferRequest(a.actor, requestInput({ priceMode: "FIXED", priceCents: "" }))).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(createTransferRequest(a.actor, requestInput({ pickupPlaceId: "atlantis" }))).rejects.toMatchObject({ code: "VALIDATION" });
  });
});

describe("Börsenfilter", () => {
  it("filtert nach Ort, Region, Datum, Kategorie, Personen und Preis", async () => {
    const a = await verifiedTaxi();
    const b = await verifiedTaxi();
    const r1 = await createTransferRequest(a.actor, requestInput({ pickupPlaceId: "innsbruck", dropoffPlaceId: "muc", passengers: 2, priceCents: 22000, pickupAt: inHours(24).toISOString() }));
    const r2 = await createTransferRequest(a.actor, requestInput({ pickupPlaceId: "muc", dropoffPlaceId: "kitzbuehel", passengers: 6, vehicleCategory: "MINIBUS", priceCents: 31000, pickupAt: inHours(72).toISOString() }));
    const r3 = await createTransferRequest(a.actor, requestInput({ pickupPlaceId: "salzburg", dropoffPlaceId: "szg", passengers: 1, priceCents: 5000, priceMode: "FIXED", pickupAt: inHours(30).toISOString() }));
    const ids = async (f: Record<string, unknown>) => (await searchBoard(b.actor, f)).map((r) => r.id);

    expect(await ids({ from: "innsbruck" })).toEqual([r1.id]);
    expect(await ids({ to: "muc" })).toEqual([r1.id]);
    expect(await ids({ fromRegion: "DE-BY" })).toEqual([r2.id]);
    expect(await ids({ toRegion: "AT-7" })).toEqual([r2.id]);
    expect(await ids({ country: "DE" })).toEqual([r1.id, r2.id]);
    // Kategorie = eigenes Fahrzeug: zeigt Aufträge, die damit fahrbar sind
    expect(await ids({ vehicleCategory: "SEDAN" })).toEqual([r1.id, r3.id]);
    expect(await ids({ vehicleCategory: "MINIBUS" })).toEqual([r1.id, r3.id, r2.id]);
    expect(await ids({ minPassengers: "5" })).toEqual([r2.id]);
    expect(await ids({ maxPrice: "25000" })).toEqual([r1.id, r3.id]);
    expect(await ids({ priceMode: "FIXED" })).toEqual([r3.id]);
    const day = inHours(72).toISOString().slice(0, 10);
    expect(await ids({ dateFrom: day, dateTo: day })).toEqual([r2.id]);
  });
});

describe("Szenario D und E: Berechtigungen und Datenschutz", () => {
  it("Reisebüro stellt Anfragen, sieht aber keine Börse und gibt keine Angebote ab", async () => {
    const agency = await verifiedAgency();
    const taxi = await verifiedTaxi();
    const req = await createTransferRequest(agency.actor, requestInput());
    await expect(searchBoard(agency.actor, {})).rejects.toMatchObject({ code: "FORBIDDEN" });
    const other = await createTransferRequest(taxi.actor, requestInput({ priceMode: "FIXED", priceCents: 20000 }));
    await expect(submitQuote(agency.actor, other.id, { amountCents: 100, vehicleCategory: "SEDAN" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(takeFixedPriceRequest(agency.actor, other.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((await searchBoard(taxi.actor, {})).map((r) => r.id)).toContain(req.id);
  });

  it("ungeprüftes Taxiunternehmen hat keinen Zugang zur Börse", async () => {
    const a = await verifiedTaxi();
    await createTransferRequest(a.actor, requestInput());
    const unverified = await register("TRANSPORT_COMPANY");
    await expect(searchBoard(unverified.actor, {})).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(createTransferRequest(unverified.actor, requestInput())).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("Börse und Detailansicht zeigen Fremden keine Adressen, Fahrgäste oder Referenzen", async () => {
    const agency = await verifiedAgency();
    const b = await verifiedTaxi();
    const req = await createTransferRequest(agency.actor, requestInput());
    const [row] = await searchBoard(b.actor, {});
    for (const k of ["pickupAddress", "dropoffAddress", "pickupNotes", "clientReference", "passengersContact"]) {
      expect(row).not.toHaveProperty(k);
    }
    const view = await getTransferRequest(b.actor, req.id);
    expect(view.role).toBe("market");
    expect(view.contacts).toEqual([]);
    expect(view.request.pickupAddress).toBeNull();
    expect(view.request.clientReference).toBeNull();
    expect(view.request.requesterOrg.email).toBeNull();
    expect(view.events).toEqual([]);

    const own = await getTransferRequest(agency.actor, req.id);
    expect(own.role).toBe("requester");
    expect(own.contacts[0].name).toBe("Familie Gruber");
    expect(own.request.clientReference).toBe("RB-4711");
  });

  it("nach Vergabe: Ausführender sieht Fahrgastdaten, alle anderen nichts mehr", async () => {
    const agency = await verifiedAgency();
    const [b, c] = await Promise.all([verifiedTaxi(), verifiedTaxi()]);
    const req = await createTransferRequest(agency.actor, requestInput());
    const qb = await submitQuote(b.actor, req.id, { amountCents: 23000, vehicleCategory: "VAN" });
    await submitQuote(c.actor, req.id, { amountCents: 25000, vehicleCategory: "VAN" });

    // Anbieter sehen nur ihr eigenes Angebot
    const cView = await getTransferRequest(c.actor, req.id);
    expect(cView.quotes).toHaveLength(1);
    expect(cView.quotes[0].providerOrgId).toBe(c.org.id);

    await acceptQuote(agency.actor, qb.id);
    const bView = await getTransferRequest(b.actor, req.id);
    expect(bView.role).toBe("provider");
    expect(bView.contacts[0].phone).toBe("+43 660 1234567");
    expect(bView.request.pickupAddress).toContain("Maria-Theresien");
    expect(bView.request.clientReference).toBeNull(); // Kundenreferenz bleibt beim Auftraggeber
    // Verlauf ohne Angebote der Mitbewerber
    expect(bView.events.some((e) => e.actorOrgId === c.org.id)).toBe(false);
    expect(JSON.stringify(bView.events)).not.toContain("25000");
    expect(bView.events.map((e) => e.type)).toContain("quote.accepted");
    await expect(getTransferRequest(c.actor, req.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("Rollen innerhalb der Firma: Buchhaltung darf keine Angebote abgeben oder annehmen", async () => {
    const a = await verifiedTaxi();
    const b = await verifiedTaxi();
    const req = await createTransferRequest(a.actor, requestInput());
    const fin = await addMember(b.org.id, "FINANCE");
    await expect(submitQuote(fin.actor, req.id, { amountCents: 20000, vehicleCategory: "VAN" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const q = await submitQuote(b.actor, req.id, { amountCents: 20000, vehicleCategory: "VAN" });
    const viewer = await addMember(a.org.id, "VIEWER");
    await expect(acceptQuote(viewer.actor, q.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("Statuswechsel nur durch Beteiligte", async () => {
    const a = await verifiedTaxi();
    const [b, c] = await Promise.all([verifiedTaxi(), verifiedTaxi()]);
    const req = await createTransferRequest(a.actor, requestInput({ priceMode: "FIXED", priceCents: 20000 }));
    const bk = await takeFixedPriceRequest(b.actor, req.id);
    await expect(startTrip(c.actor, bk.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(completeTrip(a.actor, bk.id)).rejects.toMatchObject({ code: "NOT_FOUND" }); // Auftraggeber schließt nicht ab
    await expect(disputeBooking(c.actor, bk.id, "x")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
