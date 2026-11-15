import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createTransferRequest, startTrip, takeFixedPriceRequest } from "@/server/services/marketplace";
import { trackingView } from "@/server/services/tracking";
import { addMember, inHours, requestInput, verifiedAgency, verifiedTaxi } from "./helpers";

describe("Live-Status-Link", () => {
  it("zeigt Strecke und Firma ohne Login, Position nur während der Fahrt, keine Fahrgastdaten", async () => {
    const agency = await verifiedAgency("Reisebüro A");
    const taxi = await verifiedTaxi("Taxi B");
    const req = await createTransferRequest(agency.actor, requestInput({ priceMode: "FIXED" }));
    const booking = await takeFixedPriceRequest(taxi.actor, req.id);
    const { trackToken } = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(trackToken).toMatch(/^[a-f0-9]{32}$/);
    expect(await trackingView("x")).toBeNull();
    expect(await trackingView("0".repeat(32))).toBeNull();

    const driver = await addMember(taxi.org.id, "DRIVER");
    await db.booking.update({ where: { id: booking.id }, data: { driverId: driver.user.id } });
    await db.driverShift.create({ data: { organizationId: taxi.org.id, userId: driver.user.id, lastLat: 47.3, lastLng: 11.5, lastPositionAt: new Date() } });

    let v = (await trackingView(trackToken))!;
    expect(v).toMatchObject({ status: "CONFIRMED", company: "Taxi B", position: null, etaMinutes: null });
    expect(JSON.stringify(v)).not.toContain("Gruber");
    expect(JSON.stringify(v)).not.toContain("Maria-Theresien");

    await startTrip(taxi.actor, booking.id);
    await db.booking.update({ where: { id: booking.id }, data: { tripStage: "TO_PICKUP" } });
    v = (await trackingView(trackToken))!;
    expect(v.stage).toBe("TO_PICKUP");
    expect(v.position).toMatchObject({ lat: 47.3, lng: 11.5 });
    expect(v.etaMinutes).toBeGreaterThan(0);

    // veraltete Position wird nicht gezeigt
    await db.driverShift.updateMany({ data: { lastPositionAt: new Date(Date.now() - 20 * 60_000) } });
    expect((await trackingView(trackToken))!.position).toBeNull();

    // 24 Stunden nach der Abholzeit ist der Link ungültig
    await db.transferRequest.update({ where: { id: req.id }, data: { pickupAt: inHours(-25) } });
    expect(await trackingView(trackToken)).toBeNull();
  });
});
