import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { cancelBooking, createTransferRequest, getTransferRequest, searchBoard, takeFixedPriceRequest } from "@/server/services/marketplace";
import { returnBooking } from "@/server/services/booking-extras";
import { addPartner, blockOrg } from "@/server/services/partners";
import { sendMessage } from "@/server/services/messages";
import { login } from "@/server/services/auth";
import { registerOrganization } from "@/server/services/registration";
import { addMember, orgInput, requestInput, verifiedTaxi } from "./helpers";

describe("Sicherheit", () => {
  it("zurückgegebener Partner-Auftrag bleibt bei den Partnern", async () => {
    const poster = await verifiedTaxi("Taxi Abgeber");
    const partner = await verifiedTaxi("Taxi Partner");
    const stranger = await verifiedTaxi("Taxi Fremd");
    await addPartner(poster.actor, partner.org.id);
    const req = await createTransferRequest(poster.actor, requestInput({ audience: "PARTNERS", priceMode: "FIXED" }));
    const booking = await takeFixedPriceRequest(partner.actor, req.id);
    await returnBooking(partner.actor, booking.id, "Fahrzeug defekt");
    expect((await db.transferRequest.findUniqueOrThrow({ where: { id: req.id } })).audience).toBe("PARTNERS");
    expect(await searchBoard(stranger.actor, {})).toEqual([]);
  });

  it("gesperrte Firma kann im begonnenen Chat nicht weiterschreiben", async () => {
    const poster = await verifiedTaxi("Taxi Abgeber");
    const other = await verifiedTaxi("Taxi Frager");
    const req = await createTransferRequest(poster.actor, requestInput());
    await sendMessage(other.actor, req.id, { body: "Noch frei?" });
    await blockOrg(poster.actor, other.org.id);
    await expect(sendMessage(other.actor, req.id, { body: "Hallo?" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("Fahrer öffnen keine Auftragsseite mit Preisen", async () => {
    const poster = await verifiedTaxi("Taxi Abgeber");
    const driver = await addMember(poster.org.id, "DRIVER");
    const req = await createTransferRequest(poster.actor, requestInput());
    await expect(getTransferRequest(driver.actor, req.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("Buchende der ausführenden Firma können deren Fahrten nicht stornieren", async () => {
    const poster = await verifiedTaxi("Taxi Abgeber");
    const taker = await verifiedTaxi("Taxi Nehmer");
    const booker = await addMember(taker.org.id, "BOOKER");
    const req = await createTransferRequest(poster.actor, requestInput({ priceMode: "FIXED" }));
    const booking = await takeFixedPriceRequest(taker.actor, req.id);
    await expect(cancelBooking(booker.actor, booking.id, "weg")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("Aufträge gesperrter Auftraggeber sind nicht mehr übernehmbar", async () => {
    const poster = await verifiedTaxi("Taxi Abgeber");
    const taker = await verifiedTaxi("Taxi Nehmer");
    const req = await createTransferRequest(poster.actor, requestInput({ priceMode: "FIXED" }));
    await db.organization.update({ where: { id: poster.org.id }, data: { status: "SUSPENDED" } });
    await expect(takeFixedPriceRequest(taker.actor, req.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("Fremde sperren mit falschen Passwörtern nicht das Konto für den Besitzer", async () => {
    const input = orgInput("TRAVEL_AGENCY");
    await registerOrganization(input);
    for (let i = 0; i < 10; i++) await login({ email: input.user.email, password: "falsch-falsch" }, { ip: "203.0.113.9" }).catch(() => null);
    await expect(login({ email: input.user.email, password: input.user.password }, { ip: "203.0.113.9" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(login({ email: input.user.email, password: input.user.password }, { ip: "198.51.100.7" })).resolves.toBeTruthy();
  });
});
