import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { actorCan } from "@/server/authz/context";
import {
  adminGetOrganization,
  adminListOrganizations,
  adminReviewCapability,
  adminReviewDocument,
  adminSetOrganizationStatus,
} from "@/server/services/admin";
import { deleteDocument, getDocumentForDownload, listOwnDocuments, uploadDocument } from "@/server/services/documents";
import { addMember, createAdmin, PDF, register, reload, setCapability } from "./helpers";

const file = (bytes = PDF, mimeType = "application/pdf") => ({ name: "konzession.pdf", mimeType, bytes });

describe("Nachweisdokumente", () => {
  it("Upload prüft Typ, Inhalt und Größe", async () => {
    const { actor } = await register("TRANSPORT_COMPANY");
    const ok = await uploadDocument(actor, { type: "TAXI_CONCESSION", title: "Konzession Innsbruck" }, file());
    expect(ok.status).toBe("PENDING");
    const fakePdf = new Uint8Array(Buffer.from("<html>"));
    await expect(uploadDocument(actor, { type: "INSURANCE", title: "x" }, file(fakePdf))).rejects.toMatchObject({
      code: "VALIDATION",
    });
    await expect(
      uploadDocument(actor, { type: "INSURANCE", title: "x" }, file(PDF, "application/x-msdownload")),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    big.set(PDF);
    await expect(uploadDocument(actor, { type: "INSURANCE", title: "x" }, file(big))).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("fremde Organisationen können Dokumente weder sehen noch laden (Szenario E)", async () => {
    const taxi = await register("TRANSPORT_COMPANY");
    const agency = await register("TRAVEL_AGENCY");
    const doc = await uploadDocument(taxi.actor, { type: "INSURANCE", title: "Police" }, file());
    expect(await listOwnDocuments(agency.actor)).toEqual([]);
    await expect(getDocumentForDownload(agency.actor, doc.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(deleteDocument(agency.actor, doc.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await getDocumentForDownload(taxi.actor, doc.id)).id).toBe(doc.id);
    // Buchungsmitarbeiter derselben Firma brauchen keine Nachweise
    const booker = await addMember(taxi.org.id, "BOOKER");
    await expect(getDocumentForDownload(booker.actor, doc.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    // Admin darf prüfen
    expect((await getDocumentForDownload(await createAdmin(), doc.id)).id).toBe(doc.id);
  });

  it("geprüfte Dokumente können nicht gelöscht werden", async () => {
    const taxi = await register("TRANSPORT_COMPANY");
    const doc = await uploadDocument(taxi.actor, { type: "INSURANCE", title: "Police" }, file());
    await adminReviewDocument(await createAdmin(), doc.id, { status: "APPROVED" });
    await expect(deleteDocument(taxi.actor, doc.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("Plattformadministration", () => {
  it("Nicht-Admins haben keinen Zugriff auf Adminfunktionen", async () => {
    const taxi = await register("TRANSPORT_COMPANY");
    await expect(adminListOrganizations(taxi.actor)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(adminGetOrganization(taxi.actor, taxi.org.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      adminReviewCapability(taxi.actor, taxi.org.id, "TRANSFER_BOOKER", { status: "VERIFIED" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(adminSetOrganizationStatus(taxi.actor, taxi.org.id, "ACTIVE")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(adminListOrganizations(null)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("Filter nach Typ und Prüfstatus", async () => {
    const admin = await createAdmin();
    await register("TRANSPORT_COMPANY", "Taxi Tirol");
    const agency = await register("TRAVEL_AGENCY", "Alpen Reisen");
    await setCapability(agency.org.id, "TRANSFER_BOOKER", "VERIFIED");
    expect((await adminListOrganizations(admin, { type: "TRAVEL_AGENCY" })).map((o) => o.name)).toEqual(["Alpen Reisen"]);
    expect((await adminListOrganizations(admin, { q: "tirol" })).map((o) => o.name)).toEqual(["Taxi Tirol"]);
    expect((await adminListOrganizations(admin, { capabilityStatus: "VERIFIED" })).map((o) => o.name)).toEqual([
      "Alpen Reisen",
    ]);
  });

  it("Sperre entzieht Marktplatzrechte sofort und wird protokolliert", async () => {
    const admin = await createAdmin();
    const agency = await register("TRAVEL_AGENCY");
    await adminReviewCapability(admin, agency.org.id, "TRANSFER_BOOKER", { status: "VERIFIED" });
    expect(actorCan(await reload(agency.actor), "transfers.request")).toBe(true);

    await adminSetOrganizationStatus(admin, agency.org.id, "SUSPENDED", "Missbrauchsverdacht");
    expect(actorCan(await reload(agency.actor), "transfers.request")).toBe(false);

    const events = await db.auditEvent.findMany({ where: { organizationId: agency.org.id }, orderBy: { createdAt: "asc" } });
    expect(events.map((e) => e.action)).toEqual([
      "organization.registered",
      "capability.reviewed",
      "organization.status_changed",
    ]);
  });

  it("nicht beantragte Funktion kann nicht freigeschaltet werden", async () => {
    const admin = await createAdmin();
    const agency = await register("TRAVEL_AGENCY");
    await expect(
      adminReviewCapability(admin, agency.org.id, "TRANSPORT_PROVIDER", { status: "VERIFIED" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
