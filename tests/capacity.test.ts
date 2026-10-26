import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createVehicle, listMarketCapacity, publishCapacity, setCapacityStatus } from "@/server/services/fleet";
import { createTransferRequest } from "@/server/services/marketplace";
import { categoryFits, findMatchesForCapacity, matchCapacity } from "@/server/services/matching";
import { estimateMinutes } from "@/lib/places";
import { inHours, register, requestInput, verifiedAgency, verifiedTaxi } from "./helpers";

describe("Fahrzeuge und Kapazitäten", () => {
  it("nur verifizierte Beförderungsunternehmen verwalten Fahrzeuge und Kapazitäten (Szenario D)", async () => {
    const agency = await verifiedAgency();
    await expect(createVehicle(agency.actor, { label: "Bus", category: "VAN", seats: 8, luggage: 8 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      publishCapacity(agency.actor, { vehicleCategory: "VAN", seats: 8, luggage: 8, fromPlaceId: "muc", toPlaceId: "innsbruck", availableFrom: inHours(2), availableUntil: inHours(5) }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    const unverified = await register("TRANSPORT_COMPANY");
    await expect(createVehicle(unverified.actor, { label: "V", category: "VAN", seats: 8, luggage: 8 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("geplante Rückfahrt startet als PLANNED und wird erst durch Bestätigung verbindlich", async () => {
    const taxi = await verifiedTaxi();
    const v = await createVehicle(taxi.actor, { label: "Van 1", category: "VAN", seats: 8, luggage: 8, licensePlate: "I-123AB" });
    const offer = await publishCapacity(taxi.actor, { vehicleId: v.id, fromPlaceId: "muc", toPlaceId: "innsbruck", availableFrom: inHours(2), availableUntil: inHours(5) });
    expect(offer).toMatchObject({ status: "PLANNED", seats: 8, vehicleCategory: "VAN" });
    await setCapacityStatus(taxi.actor, offer.id, "CONFIRMED");
    expect((await db.capacityOffer.findUniqueOrThrow({ where: { id: offer.id } })).status).toBe("CONFIRMED");

    const other = await verifiedAgency();
    const market = await listMarketCapacity(other.actor);
    expect(market).toHaveLength(1);
    expect(market[0]).not.toHaveProperty("vehicle"); // kein Kennzeichen nach außen
    await expect(setCapacityStatus(other.actor, offer.id, "WITHDRAWN")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("Szenario C: Rückfahrtvermittlung", () => {
  it("Schätzung der Fahrzeit Innsbruck ↔ Flughafen München ist plausibel", () => {
    const m = estimateMinutes("innsbruck", "muc");
    expect(m).toBeGreaterThan(95);
    expect(m).toBeLessThan(140);
  });

  it("Kategorie: größere Fahrzeuge passen für kleinere Aufträge, Sonderfahrzeuge nicht", () => {
    expect(categoryFits("VAN", "SEDAN")).toBe(true);
    expect(categoryFits("SEDAN", "VAN")).toBe(false);
    expect(categoryFits("VAN", "WHEELCHAIR")).toBe(false);
    expect(categoryFits("LUXURY", null)).toBe(true);
  });

  it("Rückfahrt München → Innsbruck findet passenden Auftrag München → Hall, nicht die falsche Richtung", async () => {
    const provider = await verifiedTaxi("Taxi Innsbruck");
    const agency = await verifiedAgency("Reisebüro Hall");
    const t0 = inHours(24);
    const offer = await publishCapacity(provider.actor, {
      vehicleCategory: "VAN", seats: 7, luggage: 7, fromPlaceId: "muc", toPlaceId: "innsbruck",
      availableFrom: t0, availableUntil: new Date(t0.getTime() + 3 * 3600_000), maxDetourMinutes: 20, maxWaitMinutes: 60,
    });
    const fits = await createTransferRequest(agency.actor, requestInput({ pickupPlaceId: "muc", dropoffPlaceId: "hall", pickupAt: new Date(t0.getTime() + 30 * 60_000).toISOString(), passengers: 4, luggage: 4 }));
    await createTransferRequest(agency.actor, requestInput({ pickupPlaceId: "innsbruck", dropoffPlaceId: "muc", pickupAt: new Date(t0.getTime() + 30 * 60_000).toISOString() }));
    await createTransferRequest(agency.actor, requestInput({ pickupPlaceId: "muc", dropoffPlaceId: "st-anton", pickupAt: new Date(t0.getTime() + 30 * 60_000).toISOString() }));
    await createTransferRequest(agency.actor, requestInput({ pickupPlaceId: "muc", dropoffPlaceId: "innsbruck", pickupAt: new Date(t0.getTime() + 30 * 60_000).toISOString(), passengers: 9 }));
    await createTransferRequest(agency.actor, requestInput({ pickupPlaceId: "muc", dropoffPlaceId: "innsbruck", pickupAt: new Date(t0.getTime() + 5 * 3600_000).toISOString() }));

    const matches = await findMatchesForCapacity(provider.actor, offer.id);
    expect(matches.map((m) => m.request.id)).toEqual([fits.id]);
    expect(matches[0].match.detourMinutes).toBeLessThanOrEqual(20);
    expect(matches[0].match.waitMinutes).toBeLessThanOrEqual(60);
  });

  it("Gründe für Nichtpassen werden benannt", () => {
    const offer = {
      fromPlaceId: "muc", toPlaceId: "innsbruck", availableFrom: new Date("2026-12-01T10:00:00Z"), availableUntil: new Date("2026-12-01T13:00:00Z"),
      seats: 4, luggage: 4, maxDetourMinutes: 15, maxWaitMinutes: 30, vehicleCategory: "SEDAN" as const,
    };
    const base = { pickupPlaceId: "muc", dropoffPlaceId: "innsbruck", pickupAt: new Date("2026-12-01T10:15:00Z"), pickupWindowMinutes: 0, passengers: 2, luggage: 2, vehicleCategory: null };
    expect(matchCapacity(offer, base).fits).toBe(true);
    expect(matchCapacity(offer, { ...base, passengers: 5 })).toMatchObject({ fits: false, reason: "zu wenige Plätze" });
    expect(matchCapacity(offer, { ...base, vehicleCategory: "VAN" })).toMatchObject({ fits: false });
    expect(matchCapacity(offer, { ...base, pickupAt: new Date("2026-12-01T12:00:00Z") })).toMatchObject({ fits: false });
    expect(matchCapacity(offer, { ...base, dropoffPlaceId: "kitzbuehel" })).toMatchObject({ fits: false });
  });
});
