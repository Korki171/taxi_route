import type { Capability, DocumentType, MemberRole } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword } from "@/server/auth/password";
import { loadActor, type OrgActor, type Actor } from "@/server/authz/context";
import { registerOrganization } from "@/server/services/registration";

let n = 0;
export const PDF = new Uint8Array(Buffer.from("%PDF-1.4\n%test\n"));

export function orgInput(type: "TRANSPORT_COMPANY" | "TRAVEL_AGENCY", name?: string) {
  n++;
  return {
    user: { name: `Inhaber ${n}`, email: `owner${n}@example.com`, password: "sehr-sicheres-pw" },
    organization: {
      type,
      name: name ?? `${type === "TRANSPORT_COMPANY" ? "Taxi" : "Reisebüro"} ${n}`,
      street: "Museumstraße 1",
      postalCode: "6020",
      city: "Innsbruck",
      country: "at",
      email: `office${n}@example.com`,
      phone: "+43 512 000000",
      vatId: "ATU12345678",
    },
  };
}

export async function register(type: "TRANSPORT_COMPANY" | "TRAVEL_AGENCY", name?: string) {
  const { user, organization } = await registerOrganization(orgInput(type, name));
  return { user, org: organization, actor: (await loadActor(user.id, organization.id)) as OrgActor };
}

export async function setCapability(orgId: string, capability: Capability, status: "VERIFIED" | "UNVERIFIED") {
  await db.organizationCapability.upsert({
    where: { organizationId_capability: { organizationId: orgId, capability } },
    create: { organizationId: orgId, capability, status },
    update: { status },
  });
}

export async function addMember(orgId: string, role: MemberRole) {
  n++;
  const user = await db.user.create({
    data: { email: `member${n}@example.com`, name: `Mitglied ${n}`, passwordHash: await hashPassword("x".repeat(12)) },
  });
  const membership = await db.membership.create({ data: { userId: user.id, organizationId: orgId, role } });
  return { user, membership, actor: (await loadActor(user.id, orgId)) as OrgActor };
}

export async function createAdmin(): Promise<Actor> {
  n++;
  const user = await db.user.create({
    data: {
      email: `admin${n}@taxiroute.test`,
      name: "Plattform-Admin",
      passwordHash: await hashPassword("x".repeat(12)),
      isPlatformAdmin: true,
    },
  });
  return (await loadActor(user.id, null))!;
}

export async function reload(actor: Actor): Promise<OrgActor> {
  return (await loadActor(actor.userId, actor.org?.id ?? null)) as OrgActor;
}

export function addDocument(orgId: string, type: DocumentType, status: "PENDING" | "APPROVED", validUntil?: Date) {
  return db.verificationDocument.create({
    data: {
      organizationId: orgId,
      type,
      title: type,
      fileName: "x.pdf",
      mimeType: "application/pdf",
      sizeBytes: PDF.byteLength,
      content: Buffer.from(PDF),
      status,
      validUntil,
      uploadedById: "test",
    },
  });
}

/** Verifiziertes Taxiunternehmen (Beförderung + Auftraggeber). */
export async function verifiedTaxi(name?: string) {
  const r = await register("TRANSPORT_COMPANY", name);
  await setCapability(r.org.id, "TRANSPORT_PROVIDER", "VERIFIED");
  await setCapability(r.org.id, "TRANSFER_BOOKER", "VERIFIED");
  return { ...r, actor: await reload(r.actor) };
}

/** Verifiziertes Reisebüro (nur Auftraggeber). */
export async function verifiedAgency(name?: string) {
  const r = await register("TRAVEL_AGENCY", name);
  await setCapability(r.org.id, "TRANSFER_BOOKER", "VERIFIED");
  return { ...r, actor: await reload(r.actor) };
}

export function inHours(h: number) {
  return new Date(Date.now() + h * 3600_000);
}

export function requestInput(over: Record<string, unknown> = {}) {
  return {
    pickupPlaceId: "innsbruck",
    dropoffPlaceId: "muc",
    pickupAddress: "Maria-Theresien-Straße 1, 6020 Innsbruck",
    pickupAt: inHours(48).toISOString(),
    pickupWindowMinutes: 15,
    passengers: 3,
    luggage: 4,
    skiEquipment: 2,
    flightNumber: "LH2471",
    priceMode: "NEGOTIABLE",
    priceCents: 24000,
    clientReference: "RB-4711",
    passengerName: "Familie Gruber",
    passengerPhone: "+43 660 1234567",
    ...over,
  };
}
