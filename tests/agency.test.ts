import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { renderConfirmationPdf } from "@/server/pdf/confirmation";
import { agencyOverview, transferState } from "@/server/services/agency";
import { getBookingConfirmation } from "@/server/services/confirmation";
import {
  acceptQuote,
  createTransferRequest,
  declineInvitation,
  getTransferRequest,
  inviteProviders,
  listInvitations,
  listProviderDirectory,
  openRequestToMarket,
  searchBoard,
  submitQuote,
  takeFixedPriceRequest,
} from "@/server/services/marketplace";
import { addMember, register, requestInput, verifiedAgency, verifiedTaxi } from "./helpers";

describe("Szenario B: gezielte Angebotsanfragen", () => {
  it("nur eingeladene Unternehmen sehen und beantworten die Anfrage", async () => {
    const agency = await verifiedAgency("Reisebüro Alpen");
    const invited = await verifiedTaxi("Taxi Eingeladen");
    const other = await verifiedTaxi("Taxi Fremd");
    const req = await createTransferRequest(agency.actor, requestInput({ visibility: "INVITED", invitedOrgIds: [invited.org.id] }));
    expect(req.visibility).toBe("INVITED");

    expect((await searchBoard(invited.actor, {})).map((r) => r.id)).toEqual([req.id]);
    expect(await searchBoard(other.actor, {})).toEqual([]);
    await expect(getTransferRequest(other.actor, req.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(submitQuote(other.actor, req.id, { amountCents: 20000, vehicleCategory: "VAN" })).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect((await listInvitations(invited.actor)).map((i) => i.requestId)).toEqual([req.id]);
    expect(await listInvitations(other.actor)).toEqual([]);

    const q = await submitQuote(invited.actor, req.id, { amountCents: 21000, vehicleCategory: "VAN" });
    const inv = await db.quoteInvitation.findFirstOrThrow({ where: { requestId: req.id } });
    expect(inv.status).toBe("RESPONDED");
    expect(await listInvitations(invited.actor)).toEqual([]); // beantwortet, nicht mehr offen

    const detail = await getTransferRequest(agency.actor, req.id);
    expect(detail.invitations.map((i) => [i.providerOrg.name, i.status])).toEqual([["Taxi Eingeladen", "RESPONDED"]]);
    const booking = await acceptQuote(agency.actor, q.id);
    expect(booking.providerOrgId).toBe(invited.org.id);
  });

  it("Festpreis nur für Eingeladene übernehmbar", async () => {
    const agency = await verifiedAgency();
    const invited = await verifiedTaxi();
    const other = await verifiedTaxi();
    const req = await createTransferRequest(agency.actor, requestInput({ priceMode: "FIXED", priceCents: 19000, visibility: "INVITED", invitedOrgIds: [invited.org.id] }));
    await expect(takeFixedPriceRequest(other.actor, req.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const b = await takeFixedPriceRequest(invited.actor, req.id);
    expect(b.providerOrgId).toBe(invited.org.id);
  });

  it("verlangt bei gezielter Anfrage geprüfte Unternehmen", async () => {
    const agency = await verifiedAgency();
    const unverified = await register("TRANSPORT_COMPANY");
    await expect(createTransferRequest(agency.actor, requestInput({ visibility: "INVITED" }))).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(
      createTransferRequest(agency.actor, requestInput({ visibility: "INVITED", invitedOrgIds: [unverified.org.id] })),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    // Die eigene Organisation wird ignoriert, dann bleibt niemand übrig
    await expect(
      createTransferRequest(agency.actor, requestInput({ visibility: "INVITED", invitedOrgIds: [agency.org.id] })),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("Ablehnen, weitere anfragen und für die Börse freigeben", async () => {
    const agency = await verifiedAgency();
    const a = await verifiedTaxi();
    const b = await verifiedTaxi();
    const c = await verifiedTaxi();
    const req = await createTransferRequest(agency.actor, requestInput({ visibility: "INVITED", invitedOrgIds: [a.org.id] }));

    await declineInvitation(a.actor, req.id, "Kein Fahrzeug frei");
    expect(await searchBoard(a.actor, {})).toEqual([]); // abgelehnt: gezielte Anfrage verschwindet
    await expect(declineInvitation(a.actor, req.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const afterDecline = await agencyOverview(agency.actor);
    expect(transferState(afterDecline.upcoming[0]).label).toBe("Alle Angefragten haben abgelehnt");

    expect(await inviteProviders(agency.actor, req.id, [a.org.id, b.org.id])).toBe(1); // a war schon angefragt
    expect((await searchBoard(b.actor, {})).map((r) => r.id)).toEqual([req.id]);
    expect(await searchBoard(c.actor, {})).toEqual([]);
    await expect(inviteProviders(b.actor, req.id, [c.org.id])).rejects.toMatchObject({ code: "NOT_FOUND" }); // nur Auftraggeber

    await openRequestToMarket(agency.actor, req.id);
    expect((await searchBoard(c.actor, {})).map((r) => r.id)).toEqual([req.id]);
    await expect(openRequestToMarket(agency.actor, req.id)).rejects.toMatchObject({ code: "NOT_FOUND" });

    const events = await db.transferEvent.findMany({ where: { requestId: req.id }, orderBy: { createdAt: "asc" } });
    expect(events.map((e) => e.type)).toEqual(["request.created", "request.invited", "invitation.declined", "request.invited", "request.opened_to_market"]);
  });

  it("Börsenauftrag mit Direktanfrage: alle sehen ihn, Eingeladene zusätzlich als Anfrage", async () => {
    const agency = await verifiedAgency();
    const a = await verifiedTaxi();
    const b = await verifiedTaxi();
    const req = await createTransferRequest(agency.actor, requestInput({ visibility: "MARKET", invitedOrgIds: [a.org.id] }));
    expect((await searchBoard(b.actor, {})).map((r) => r.id)).toEqual([req.id]);
    const rowA = (await searchBoard(a.actor, {}))[0];
    expect(rowA.invitations).toEqual([{ status: "PENDING" }]);
    await declineInvitation(a.actor, req.id);
    expect((await searchBoard(a.actor, {})).map((r) => r.id)).toEqual([req.id]); // bleibt in der Börse sichtbar
  });

  it("Verzeichnis: geprüfte Unternehmen, bisherige Partner zuerst", async () => {
    const agency = await verifiedAgency();
    const a = await verifiedTaxi("Alpha Taxi");
    const z = await verifiedTaxi("Zeta Taxi");
    await register("TRANSPORT_COMPANY", "Ungeprüft Taxi");
    const req = await createTransferRequest(agency.actor, requestInput({ priceMode: "FIXED", priceCents: 15000 }));
    await takeFixedPriceRequest(z.actor, req.id);
    const dir = await listProviderDirectory(agency.actor);
    expect(dir.map((d) => [d.name, d.trips])).toEqual([["Zeta Taxi", 1], ["Alpha Taxi", 0]]);
    expect(a.org.id).toBeTruthy();
  });
});

describe("Reisebüro-Dashboard und Auftragsbestätigung", () => {
  it("Übersicht, Suche nach Referenz und Kennzahlen", async () => {
    const agency = await verifiedAgency();
    const taxi = await verifiedTaxi("Taxi Partner");
    const open = await createTransferRequest(agency.actor, requestInput({ clientReference: "RB-1001", passengerName: "Familie Huber" }));
    const fixed = await createTransferRequest(agency.actor, requestInput({ priceMode: "FIXED", priceCents: 18000, clientReference: "RB-1002" }));
    await takeFixedPriceRequest(taxi.actor, fixed.id);
    const q = await submitQuote(taxi.actor, open.id, { amountCents: 20000, vehicleCategory: "VAN" });

    let o = await agencyOverview(agency.actor);
    expect(o.upcoming).toHaveLength(2);
    expect(o.quotesWaiting).toBe(1);
    expect(o.month).toMatchObject({ bookings: 1, spentCents: 18000 });
    expect(o.partners.map((p) => [p.org.name, p.trips])).toEqual([["Taxi Partner", 1]]);
    expect(transferState(o.upcoming.find((r) => r.id === open.id)!).label).toBe("Angebote liegen vor");

    await acceptQuote(agency.actor, q.id);
    o = await agencyOverview(agency.actor, { q: "huber" });
    expect(o.found!.map((r) => r.id)).toEqual([open.id]);
    expect(o.month.savedCents).toBe(24000 - 20000); // Richtpreis 240 €, vereinbart 200 €
    expect((await agencyOverview(agency.actor, { q: "rb-1002" })).found!.map((r) => r.id)).toEqual([fixed.id]);
    expect((await agencyOverview(agency.actor, { q: `TR-${String(fixed.number).padStart(6, "0")}` })).found!.map((r) => r.id)).toEqual([fixed.id]);

    // Fremde finden nichts
    const other = await verifiedAgency();
    expect((await agencyOverview(other.actor, { q: "huber" })).found).toEqual([]);
  });

  it("PDF nur für Beteiligte, Kundenreferenz nur im Exemplar des Auftraggebers", async () => {
    const agency = await verifiedAgency("Reisebüro Österreich");
    const taxi = await verifiedTaxi("Taxi Ötztal");
    const stranger = await verifiedTaxi();
    const req = await createTransferRequest(agency.actor, requestInput({ priceMode: "FIXED", priceCents: 24500, requirements: "Kindersitz → Gruppe 2" }));
    const booking = await takeFixedPriceRequest(taxi.actor, req.id);

    const mine = await getBookingConfirmation(agency.actor, booking.id);
    expect(mine.role).toBe("requester");
    expect(mine.request.clientReference).toBe("RB-4711");
    const theirs = await getBookingConfirmation(taxi.actor, booking.id);
    expect(theirs.role).toBe("provider");
    expect(theirs.request.clientReference).toBeNull();
    expect(theirs.request.passengersContact[0].name).toBe("Familie Gruber");

    await expect(getBookingConfirmation(stranger.actor, booking.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const driver = await addMember(taxi.org.id, "DRIVER");
    await expect(getBookingConfirmation(driver.actor, booking.id)).rejects.toMatchObject({ code: "NOT_FOUND" });

    for (const locale of ["de", "en"] as const) {
      const pdf = await renderConfirmationPdf(mine, locale);
      expect(Buffer.from(pdf.slice(0, 5)).toString()).toBe("%PDF-");
      expect(pdf.byteLength).toBeGreaterThan(2000);
    }
  });
});
