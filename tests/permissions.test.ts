import { describe, expect, it } from "vitest";
import { can, decide, assignableRoles, type OrgAuthzInput } from "@/server/authz/permissions";

const base = (over: Partial<OrgAuthzInput> = {}): OrgAuthzInput => ({
  role: "OWNER",
  orgStatus: "ACTIVE",
  capabilities: {},
  ...over,
});

describe("Berechtigungsmatrix", () => {
  it("Reisebüro ohne Beförderungsfunktion darf keine Fahrzeuge oder Kapazitäten anbieten (Szenario D)", () => {
    const agency = base({ capabilities: { TRANSFER_BOOKER: "VERIFIED" } });
    expect(can(agency, "transfers.request")).toBe(true);
    expect(can(agency, "fleet.manage")).toBe(false);
    expect(can(agency, "capacity.publish")).toBe(false);
    expect(can(agency, "jobs.accept")).toBe(false);
    expect(can(agency, "quotes.submit")).toBe(false);
  });

  it("beantragte, aber ungeprüfte Beförderungsfunktion schaltet nichts frei", () => {
    for (const status of ["UNVERIFIED", "PENDING_REVIEW", "REJECTED", "SUSPENDED"] as const) {
      expect(can(base({ capabilities: { TRANSPORT_PROVIDER: status } }), "capacity.publish")).toBe(false);
    }
    expect(can(base({ capabilities: { TRANSPORT_PROVIDER: "VERIFIED" } }), "capacity.publish")).toBe(true);
  });

  it("Mischbetrieb: Funktionen werden getrennt geprüft", () => {
    const mixed = base({ capabilities: { TRANSPORT_PROVIDER: "VERIFIED", TRANSFER_BOOKER: "PENDING_REVIEW" } });
    expect(can(mixed, "jobs.accept")).toBe(true);
    expect(can(mixed, "transfers.request")).toBe(false);
  });

  it("Rollen begrenzen auch bei verifizierter Organisation", () => {
    const caps = { TRANSPORT_PROVIDER: "VERIFIED", TRANSFER_BOOKER: "VERIFIED" } as const;
    expect(can(base({ role: "BOOKER", capabilities: caps }), "transfers.request")).toBe(true);
    expect(can(base({ role: "BOOKER", capabilities: caps }), "fleet.manage")).toBe(false);
    expect(can(base({ role: "VIEWER", capabilities: caps }), "transfers.request")).toBe(false);
    expect(can(base({ role: "FINANCE", capabilities: caps }), "billing.read")).toBe(true);
    expect(can(base({ role: "DISPATCHER", capabilities: caps }), "members.manage")).toBe(false);
  });

  it("gesperrte Organisation: nur Lesezugriff auf eigene Stammdaten", () => {
    const s = base({ orgStatus: "SUSPENDED", capabilities: { TRANSPORT_PROVIDER: "VERIFIED" } });
    expect(can(s, "org.read")).toBe(true);
    expect(can(s, "org.update")).toBe(false);
    expect(can(s, "jobs.accept")).toBe(false);
  });

  it("eingeschränkte Organisation: Profilpflege ja, Marktplatz nein", () => {
    const r = base({ orgStatus: "RESTRICTED", capabilities: { TRANSPORT_PROVIDER: "VERIFIED" } });
    expect(can(r, "org.update")).toBe(true);
    const d = decide(r, "jobs.accept");
    expect(d.allowed).toBe(false);
  });

  it("nur Inhaber vergeben die Inhaberrolle", () => {
    expect(assignableRoles("OWNER")).toContain("OWNER");
    expect(assignableRoles("ADMIN")).not.toContain("OWNER");
    expect(assignableRoles("DISPATCHER")).toEqual([]);
  });
});
