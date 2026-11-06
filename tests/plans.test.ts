import { describe, expect, it } from "vitest";
import { EN } from "@/lib/i18n-en";
import { PLANS, planStatus } from "@/lib/plans";
import { adminGetOrganization, adminSetOrganizationPlan } from "@/server/services/admin";
import { getOwnOrganization } from "@/server/services/organizations";
import { createAdmin, register } from "./helpers";

describe("Tarife", () => {
  it("Preise und Fahrzeuggrenzen wie beschlossen", () => {
    expect(PLANS.map((p) => [p.id, p.priceCents, p.vehicleLimit])).toEqual([
      ["BASIS", 3999, 3],
      ["PRO", 7999, 10],
      ["FLOTTE", 16999, null],
    ]);
    const texts = PLANS.flatMap((p) => [p.summary, ...p.features]);
    expect(texts.filter((x) => !(x in EN))).toEqual([]);
  });

  it("Status: Auftraggeber kostenlos, Pilot bis Datum, danach Tarif", () => {
    const now = new Date("2026-12-01T10:00:00Z");
    const taxi = { type: "TRANSPORT_COMPANY" as const, plan: null, planFreeUntil: null };
    expect(planStatus({ ...taxi, type: "TRAVEL_AGENCY" }, now).kind).toBe("FREE_ROLE");
    expect(planStatus(taxi, now).kind).toBe("NONE");
    expect(planStatus({ ...taxi, plan: "PRO", planFreeUntil: new Date("2027-03-31T21:59:00Z") }, now).kind).toBe("TRIAL");
    expect(planStatus({ ...taxi, plan: "PRO", planFreeUntil: new Date("2026-11-30T22:59:00Z") }, now).kind).toBe("ACTIVE");
    expect(planStatus({ ...taxi, planFreeUntil: new Date("2026-11-30T22:59:00Z") }, now).kind).toBe("NONE");
  });

  it("Admin schaltet ein Pilotunternehmen bis zu einem Datum frei, protokolliert und für das Unternehmen sichtbar", async () => {
    const admin = await createAdmin();
    const { actor, org } = await register("TRANSPORT_COMPANY");
    await adminSetOrganizationPlan(admin, org.id, { plan: "PRO", freeUntil: "2027-03-31", note: "Pilot, danach 20 % Rabatt" });

    const full = await adminGetOrganization(admin, org.id);
    expect(full.plan).toBe("PRO");
    // Ende des Tages in Wien (MESZ/MEZ): 31.03.2027 23:59 = 21:59 UTC
    expect(full.planFreeUntil?.toISOString()).toBe("2027-03-31T21:59:00.000Z");
    expect(full.planNote).toBe("Pilot, danach 20 % Rabatt");
    expect(full.auditEvents.some((e) => e.action === "organization.plan_changed")).toBe(true);

    const own = await getOwnOrganization(actor);
    expect(own.plan).toBe("PRO");
    expect("planNote" in own).toBe(false); // interne Notiz bleibt beim Admin

    await adminSetOrganizationPlan(admin, org.id, { plan: "", freeUntil: "", note: "" });
    const cleared = await adminGetOrganization(admin, org.id);
    expect([cleared.plan, cleared.planFreeUntil, cleared.planNote]).toEqual([null, null, null]);
  });

  it("nur Plattform-Admins, nur für Taxiunternehmen, nur gültige Eingaben", async () => {
    const admin = await createAdmin();
    const taxi = await register("TRANSPORT_COMPANY");
    const agency = await register("TRAVEL_AGENCY");
    await expect(adminSetOrganizationPlan(taxi.actor, taxi.org.id, { plan: "FLOTTE", freeUntil: "" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(adminSetOrganizationPlan(admin, agency.org.id, { plan: "BASIS", freeUntil: "" })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(adminSetOrganizationPlan(admin, taxi.org.id, { plan: "GOLD", freeUntil: "" })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(adminSetOrganizationPlan(admin, taxi.org.id, { plan: "BASIS", freeUntil: "31.03.2027" })).rejects.toMatchObject({ code: "VALIDATION" });
  });
});
