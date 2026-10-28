import { db } from "@/lib/db";
import { requirePermission, type Actor } from "../authz/context";
import { notFound } from "../errors";

const orgSelect = {
  id: true, name: true, legalName: true, street: true, postalCode: true, city: true, country: true,
  email: true, phone: true, vatId: true, registerNumber: true,
} as const;

/**
 * Daten für die Auftragsbestätigung (PDF). Nur Auftraggeber und ausführendes Unternehmen erhalten sie;
 * die interne Kundenreferenz des Auftraggebers steht nur in dessen Exemplar.
 */
export async function getBookingConfirmation(actor: Actor | null, bookingId: string) {
  requirePermission(actor, "org.read");
  // Fahrer sehen ihre Fahrten in der Fahreransicht, aber keine Preise.
  if (actor.org.role === "DRIVER") throw notFound();
  const b = await db.booking.findFirst({
    where: { id: bookingId, OR: [{ providerOrgId: actor.org.id }, { requesterOrgId: actor.org.id }] },
    include: {
      request: { include: { passengersContact: true } },
      requesterOrg: { select: orgSelect },
      providerOrg: { select: { ...orgSelect, transportProfile: { select: { concessionNumber: true } } } },
      vehicle: { select: { label: true, category: true, licensePlate: true } },
      driver: { select: { name: true } },
    },
  });
  if (!b) throw notFound();
  const role = b.requesterOrgId === actor.org.id ? ("requester" as const) : ("provider" as const);
  const acceptedBy = await db.user.findUnique({ where: { id: b.acceptedById }, select: { name: true } });
  return {
    role,
    booking: b,
    request: { ...b.request, clientReference: role === "requester" ? b.request.clientReference : null },
    acceptedByName: acceptedBy?.name ?? null,
  };
}

export type BookingConfirmation = Awaited<ReturnType<typeof getBookingConfirmation>>;

export function bookingReference(number: number) {
  return `B-${String(number).padStart(6, "0")}`;
}
