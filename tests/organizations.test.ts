import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { actorCan, requirePermission } from "@/server/authz/context";
import { adminReviewCapability, adminReviewDocument } from "@/server/services/admin";
import {
  getOwnOrganization,
  getPublicOrganizationProfile,
  requestCapabilityReview,
  updateOrganizationProfile,
  updateTransportProfile,
} from "@/server/services/organizations";
import { addDocument, addMember, createAdmin, orgInput, register, reload } from "./helpers";

describe("Unternehmensprofile", () => {
  it("Profil wird nur in der eigenen Organisation geändert", async () => {
    const a = await register("TRAVEL_AGENCY");
    const b = await register("TRANSPORT_COMPANY");
    const updated = await updateOrganizationProfile(a.actor, { ...orgInput("TRAVEL_AGENCY").organization, name: "Alpenreisen GmbH" });
    expect(updated.id).toBe(a.org.id);
    expect((await db.organization.findUniqueOrThrow({ where: { id: b.org.id } })).name).toBe(b.org.name);
  });

  it("Mitarbeiter ohne Verwaltungsrolle können das Profil nicht ändern", async () => {
    const a = await register("TRAVEL_AGENCY");
    const booker = await addMember(a.org.id, "BOOKER");
    await expect(updateOrganizationProfile(booker.actor, orgInput("TRAVEL_AGENCY").organization)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect((await getOwnOrganization(booker.actor)).id).toBe(a.org.id);
  });

  it("Kurzprofil fremder Organisationen enthält keine internen Daten", async () => {
    const agency = await register("TRAVEL_AGENCY");
    const taxi = await register("TRANSPORT_COMPANY");
    const p = await getPublicOrganizationProfile(agency.actor, taxi.org.id);
    expect(p.name).toBe(taxi.org.name);
    for (const key of ["email", "phone", "vatId", "street", "registerNumber", "documents", "memberships"]) {
      expect(p).not.toHaveProperty(key);
    }
  });

  it("gesperrte Organisationen sind nach außen nicht sichtbar", async () => {
    const agency = await register("TRAVEL_AGENCY");
    const taxi = await register("TRANSPORT_COMPANY");
    await db.organization.update({ where: { id: taxi.org.id }, data: { status: "SUSPENDED" } });
    await expect(getPublicOrganizationProfile(agency.actor, taxi.org.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("Transportprofil pflegbar für Taxiunternehmen, nicht für Reisebüros", async () => {
    const taxi = await register("TRANSPORT_COMPANY");
    const p = await updateTransportProfile(taxi.actor, {
      concessionNumber: "TX-123",
      vehicleCategories: ["SEDAN", "VAN"],
      declaredRegions: ["AT-7 Tirol", "DE-BY Bayern"],
      fleetSize: 6,
    });
    expect(p.vehicleCategories).toEqual(["SEDAN", "VAN"]);
    const agency = await register("TRAVEL_AGENCY");
    await expect(
      updateTransportProfile(agency.actor, { vehicleCategories: ["SEDAN"], declaredRegions: [] }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });
});

describe("Szenario D: Reisebüro als Beförderungsunternehmen", () => {
  it("Reisebüro kann keine Kapazität anbieten, auch nicht nach Antrag ohne Prüfung", async () => {
    const agency = await register("TRAVEL_AGENCY");
    expect(() => requirePermission(agency.actor, "capacity.publish")).toThrow(/Beförderungsunternehmen vorbehalten/);

    await expect(requestCapabilityReview(agency.actor, "TRANSPORT_PROVIDER")).rejects.toMatchObject({
      code: "VALIDATION",
    });
    await addDocument(agency.org.id, "TAXI_CONCESSION", "PENDING");
    await addDocument(agency.org.id, "INSURANCE", "PENDING");
    await requestCapabilityReview(agency.actor, "TRANSPORT_PROVIDER");
    const pending = await reload(agency.actor);
    expect(pending.org.capabilities.TRANSPORT_PROVIDER).toBe("PENDING_REVIEW");
    expect(actorCan(pending, "capacity.publish")).toBe(false);
  });

  it("erst nach Prüfung der Nachweise und Freigabe durch den Admin", async () => {
    const admin = await createAdmin();
    const agency = await register("TRAVEL_AGENCY");
    const concession = await addDocument(agency.org.id, "RENTAL_CAR_LICENSE", "PENDING");
    const insurance = await addDocument(agency.org.id, "INSURANCE", "PENDING");
    await requestCapabilityReview(agency.actor, "TRANSPORT_PROVIDER");

    await expect(
      adminReviewCapability(admin, agency.org.id, "TRANSPORT_PROVIDER", { status: "VERIFIED" }),
    ).rejects.toMatchObject({ code: "VALIDATION" });

    await adminReviewDocument(admin, concession.id, { status: "APPROVED" });
    await adminReviewDocument(admin, insurance.id, { status: "APPROVED" });
    await adminReviewCapability(admin, agency.org.id, "TRANSPORT_PROVIDER", { status: "VERIFIED" });

    const verified = await reload(agency.actor);
    expect(actorCan(verified, "capacity.publish")).toBe(true);
    // Reine Buchungsmitarbeiter bleiben trotzdem ohne Flottenrechte
    const booker = await addMember(agency.org.id, "BOOKER");
    expect(actorCan(booker.actor, "fleet.manage")).toBe(false);
  });

  it("abgelaufene Nachweise zählen nicht", async () => {
    const admin = await createAdmin();
    const taxi = await register("TRANSPORT_COMPANY");
    await addDocument(taxi.org.id, "TAXI_CONCESSION", "APPROVED", new Date(Date.now() - 86400000));
    await addDocument(taxi.org.id, "INSURANCE", "APPROVED");
    await expect(
      adminReviewCapability(admin, taxi.org.id, "TRANSPORT_PROVIDER", { status: "VERIFIED" }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });
});
