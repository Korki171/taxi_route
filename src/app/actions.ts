"use server";

import type { Capability } from "@prisma/client";
import { redirect } from "next/navigation";
import { createSession, invalidateSession } from "@/server/auth/session";
import { AppError, invalid } from "@/server/errors";
import { adminReviewCapability, adminReviewDocument, adminSetOrganizationStatus } from "@/server/services/admin";
import { login, switchActiveOrganization } from "@/server/services/auth";
import { deleteDocument, uploadDocument } from "@/server/services/documents";
import {
  acceptInvitation,
  changeMemberRole,
  inviteMember,
  registerViaInvitation,
  removeMember,
  revokeInvitation,
} from "@/server/services/members";
import { requestCapabilityReview, updateOrganizationProfile, updateTransportProfile } from "@/server/services/organizations";
import { registerOrganization } from "@/server/services/registration";
import { createVehicle, publishCapacity, setCapacityStatus, setVehicleActive } from "@/server/services/fleet";
import { assignBooking } from "@/server/services/dispatch";
import { advanceTrip, endShift, startShift } from "@/server/services/driver";
import {
  acceptQuote,
  cancelBooking,
  cancelTransferRequest,
  completeTrip,
  createTransferRequest,
  disputeBooking,
  rejectQuote,
  startTrip,
  submitQuote,
  takeFixedPriceRequest,
  withdrawQuote,
} from "@/server/services/marketplace";
import { fromLocalInput } from "@/lib/format";
import { parseEuroToCents } from "@/lib/money";
import { rateLimit } from "@/server/rate-limit";
import { requestPasswordReset, resetPassword } from "@/server/services/password-reset";
import {
  clientIp,
  clearSessionCookie,
  formObject,
  getActor,
  getSession,
  getSessionToken,
  runAction,
  setSessionCookie,
  withParam,
} from "@/server/web";

const ORG_FIELDS = [
  "name", "legalName", "street", "postalCode", "city", "country",
  "email", "phone", "website", "vatId", "registerNumber", "contactPerson",
];

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");

// ---------- Authentifizierung ----------

export async function registerAction(fd: FormData) {
  await runAction("/register", async () => {
    const ip = await clientIp();
    if (ip) await rateLimit(`register:ip:${ip}`, 5, 60);
    const { user, organization } = await registerOrganization({
      user: { name: str(fd, "userName"), email: str(fd, "userEmail"), password: str(fd, "password") },
      organization: { type: str(fd, "type"), ...formObject(fd, ORG_FIELDS) },
    });
    const s = await createSession(user.id, organization.id);
    await setSessionCookie(s.token, s.expiresAt);
    return "/dashboard";
  });
}

export async function loginAction(fd: FormData) {
  const next = str(fd, "next");
  await runAction("/login", async () => {
    const s = await login({ email: str(fd, "email"), password: str(fd, "password") }, { ip: await clientIp() });
    await setSessionCookie(s.token, s.expiresAt);
    // Nur interne Pfade als Rücksprungziel (kein Open Redirect).
    return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  });
}

export async function requestPasswordResetAction(fd: FormData) {
  await runAction("/passwort-vergessen", async () => {
    await requestPasswordReset({ email: str(fd, "email") });
    return withParam("/passwort-vergessen", "ok", "Falls ein Konto mit dieser E-Mail existiert, haben wir einen Link zum Zurücksetzen geschickt.");
  });
}

export async function resetPasswordAction(token: string, fd: FormData) {
  await runAction(`/passwort-zuruecksetzen/${token}`, async () => {
    if (str(fd, "password") !== str(fd, "password2")) throw invalid("Die Passwörter stimmen nicht überein.");
    await resetPassword(token, { password: str(fd, "password") });
    return withParam("/login", "ok", "Passwort geändert. Bitte melden Sie sich neu an.");
  });
}

export async function logoutAction() {
  const token = await getSessionToken();
  if (token) await invalidateSession(token);
  await clearSessionCookie();
  redirect("/login");
}

export async function switchOrgAction(fd: FormData) {
  await runAction("/dashboard", async () => {
    const session = await getSession();
    if (!session) throw new AppError("UNAUTHENTICATED", "");
    await switchActiveOrganization(session.id, session.userId, str(fd, "orgId"));
  });
}

// ---------- Einladungen ----------

export async function acceptInvitationAction(token: string) {
  await runAction(`/invite/${token}`, async () => {
    const actor = await getActor();
    const orgId = await acceptInvitation(actor, token);
    const session = await getSession();
    if (session) await switchActiveOrganization(session.id, session.userId, orgId);
    return withParam("/dashboard", "ok", "Sie sind der Organisation beigetreten.");
  });
}

export async function registerViaInvitationAction(token: string, fd: FormData) {
  await runAction(`/invite/${token}`, async () => {
    const { user, organizationId } = await registerViaInvitation(token, {
      name: str(fd, "name"),
      password: str(fd, "password"),
    });
    const s = await createSession(user.id, organizationId);
    await setSessionCookie(s.token, s.expiresAt);
    return "/dashboard";
  });
}

// ---------- Organisation ----------

export async function updateProfileAction(fd: FormData) {
  await runAction("/organization", async () => {
    await updateOrganizationProfile(await getActor(), formObject(fd, ORG_FIELDS));
    return withParam("/organization", "ok", "Unternehmensdaten gespeichert.");
  });
}

export async function updateTransportProfileAction(fd: FormData) {
  await runAction("/organization", async () => {
    const fleet = str(fd, "fleetSize").trim();
    await updateTransportProfile(await getActor(), {
      concessionNumber: str(fd, "concessionNumber"),
      vehicleCategories: fd.getAll("vehicleCategories").map(String),
      declaredRegions: str(fd, "declaredRegions").split(/[\n,]/).map((s) => s.trim()).filter(Boolean),
      fleetSize: fleet ? Number(fleet) : undefined,
    });
    return withParam("/organization", "ok", "Beförderungsdaten gespeichert.");
  });
}

export async function requestCapabilityAction(fd: FormData) {
  await runAction("/organization", async () => {
    await requestCapabilityReview(await getActor(), str(fd, "capability") as Capability);
    return withParam("/organization", "ok", "Prüfung beantragt.");
  });
}

// ---------- Team ----------

export async function inviteMemberAction(fd: FormData) {
  await runAction("/organization/members", async () => {
    const { token } = await inviteMember(await getActor(), { email: str(fd, "email"), role: str(fd, "role") });
    // MVP ohne E-Mail-Versand: Link einmalig anzeigen.
    return withParam("/organization/members", "invite", token);
  });
}

export async function revokeInvitationAction(fd: FormData) {
  await runAction("/organization/members", async () => {
    await revokeInvitation(await getActor(), str(fd, "invitationId"));
  });
}

export async function changeRoleAction(fd: FormData) {
  await runAction("/organization/members", async () => {
    await changeMemberRole(await getActor(), str(fd, "membershipId"), str(fd, "role"));
    return withParam("/organization/members", "ok", "Rolle geändert.");
  });
}

export async function removeMemberAction(fd: FormData) {
  await runAction("/organization/members", async () => {
    await removeMember(await getActor(), str(fd, "membershipId"));
    return withParam("/organization/members", "ok", "Mitglied entfernt.");
  });
}

// ---------- Nachweise ----------

export async function uploadDocumentAction(fd: FormData) {
  await runAction("/organization/documents", async () => {
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) throw invalid("Bitte eine Datei auswählen.");
    await uploadDocument(
      await getActor(),
      { type: str(fd, "type"), title: str(fd, "title"), validUntil: str(fd, "validUntil") || undefined },
      { name: file.name, mimeType: file.type, bytes: new Uint8Array(await file.arrayBuffer()) },
    );
    return withParam("/organization/documents", "ok", "Dokument hochgeladen.");
  });
}

export async function deleteDocumentAction(fd: FormData) {
  await runAction("/organization/documents", async () => {
    await deleteDocument(await getActor(), str(fd, "documentId"));
  });
}

// ---------- Administration ----------

export async function adminReviewCapabilityAction(fd: FormData) {
  const orgId = str(fd, "orgId");
  await runAction(`/admin/organizations/${orgId}`, async () => {
    await adminReviewCapability(await getActor(), orgId, str(fd, "capability") as Capability, {
      status: str(fd, "status"),
      note: str(fd, "note") || undefined,
    });
  });
}

export async function adminReviewDocumentAction(fd: FormData) {
  const orgId = str(fd, "orgId");
  await runAction(`/admin/organizations/${orgId}`, async () => {
    await adminReviewDocument(await getActor(), str(fd, "documentId"), {
      status: str(fd, "status"),
      note: str(fd, "note") || undefined,
    });
  });
}

export async function adminSetOrgStatusAction(fd: FormData) {
  const orgId = str(fd, "orgId");
  await runAction(`/admin/organizations/${orgId}`, async () => {
    await adminSetOrganizationStatus(await getActor(), orgId, str(fd, "status") as never, str(fd, "note") || undefined);
  });
}


// ---------- Börse ----------

function localDate(fd: FormData, k: string) {
  const v = str(fd, k);
  if (!v) return "";
  const d = fromLocalInput(v);
  return d ? d.toISOString() : "invalid";
}

function cents(fd: FormData, k: string) {
  const c = parseEuroToCents(str(fd, k));
  return c == null ? "" : Number.isNaN(c) ? "invalid" : c;
}

export async function createTransferRequestAction(fd: FormData) {
  await runAction("/boerse/neu", async () => {
    const req = await createTransferRequest(await getActor(), {
      ...formObject(fd, [
        "pickupPlaceId", "dropoffPlaceId", "pickupAddress", "dropoffAddress", "pickupWindowMinutes", "passengers",
        "luggage", "skiEquipment", "specialLuggage", "vehicleCategory", "childSeats", "requirements", "flightNumber",
        "pickupNotes", "priceMode", "bookingTerms", "cancellationTerms", "clientReference", "passengerName", "passengerPhone",
      ]),
      pickupAt: localDate(fd, "pickupAt"),
      flightArrivalAt: localDate(fd, "flightArrivalAt"),
      quoteDeadline: localDate(fd, "quoteDeadline"),
      priceCents: cents(fd, "price"),
    });
    return withParam(`/boerse/auftrag/${req.id}`, "ok", "Auftrag veröffentlicht.");
  });
}

export async function cancelTransferRequestAction(fd: FormData) {
  const id = str(fd, "requestId");
  await runAction(`/boerse/auftrag/${id}`, async () => {
    await cancelTransferRequest(await getActor(), id);
    return withParam(`/boerse/auftrag/${id}`, "ok", "Auftrag zurückgezogen.");
  });
}

export async function takeFixedPriceAction(fd: FormData) {
  const id = str(fd, "requestId");
  await runAction(`/boerse/auftrag/${id}`, async () => {
    await takeFixedPriceRequest(await getActor(), id, { vehicleId: str(fd, "vehicleId") || undefined });
    return withParam(`/boerse/auftrag/${id}`, "ok", "Auftrag verbindlich übernommen.");
  });
}

export async function submitQuoteAction(fd: FormData) {
  const id = str(fd, "requestId");
  await runAction(`/boerse/auftrag/${id}`, async () => {
    await submitQuote(await getActor(), id, {
      amountCents: cents(fd, "amount"),
      vehicleCategory: str(fd, "vehicleCategory"),
      message: str(fd, "message"),
      validUntil: localDate(fd, "validUntil") || undefined,
    });
    return withParam(`/boerse/auftrag/${id}`, "ok", "Angebot abgegeben.");
  });
}

export async function withdrawQuoteAction(fd: FormData) {
  const id = str(fd, "requestId");
  await runAction(`/boerse/auftrag/${id}`, async () => {
    await withdrawQuote(await getActor(), str(fd, "quoteId"));
  });
}

export async function acceptQuoteAction(fd: FormData) {
  const id = str(fd, "requestId");
  await runAction(`/boerse/auftrag/${id}`, async () => {
    await acceptQuote(await getActor(), str(fd, "quoteId"));
    return withParam(`/boerse/auftrag/${id}`, "ok", "Angebot angenommen. Die Buchung ist verbindlich.");
  });
}

export async function rejectQuoteAction(fd: FormData) {
  const id = str(fd, "requestId");
  await runAction(`/boerse/auftrag/${id}`, async () => {
    await rejectQuote(await getActor(), str(fd, "quoteId"));
  });
}

export async function bookingTransitionAction(fd: FormData) {
  const id = str(fd, "requestId");
  const bookingId = str(fd, "bookingId");
  const note = str(fd, "note");
  await runAction(`/boerse/auftrag/${id}`, async () => {
    const actor = await getActor();
    switch (str(fd, "to")) {
      case "start": await startTrip(actor, bookingId); break;
      case "complete": await completeTrip(actor, bookingId, note); break;
      case "cancel": await cancelBooking(actor, bookingId, note); break;
      case "dispute": await disputeBooking(actor, bookingId, note); break;
      default: throw invalid("Unbekannte Aktion.");
    }
  });
}

// ---------- Disposition und Fahrer ----------

export async function assignBookingAction(fd: FormData) {
  await runAction("/flotte/live", async () => {
    await assignBooking(await getActor(), str(fd, "bookingId"), formObject(fd, ["driverId", "vehicleId"]));
    return withParam("/flotte/live", "ok", "Zuweisung gespeichert.") + "#disposition";
  });
}

export async function startShiftAction(fd: FormData) {
  await runAction("/fahrer", async () => {
    await startShift(await getActor(), { vehicleId: str(fd, "vehicleId"), consent: fd.get("consent") === "on" });
  });
}

export async function endShiftAction() {
  await runAction("/fahrer", async () => {
    await endShift(await getActor());
  });
}

export async function advanceTripAction(fd: FormData) {
  await runAction("/fahrer", async () => {
    await advanceTrip(await getActor(), str(fd, "bookingId"), str(fd, "step"));
  });
}

// ---------- Flotte und Kapazitäten ----------

export async function createVehicleAction(fd: FormData) {
  await runAction("/flotte", async () => {
    await createVehicle(await getActor(), formObject(fd, ["label", "category", "licensePlate", "seats", "luggage", "skiCapacity"]));
    return withParam("/flotte", "ok", "Fahrzeug angelegt.");
  });
}

export async function setVehicleActiveAction(fd: FormData) {
  await runAction("/flotte", async () => {
    await setVehicleActive(await getActor(), str(fd, "vehicleId"), str(fd, "active") === "1");
  });
}

export async function publishCapacityAction(fd: FormData) {
  await runAction("/flotte", async () => {
    await publishCapacity(await getActor(), {
      ...formObject(fd, ["vehicleId", "fromPlaceId", "toPlaceId", "maxDetourMinutes", "maxWaitMinutes", "note"]),
      // Ohne Fahrzeug aus der Flotte: Kategorie und Plätze direkt angeben
      ...Object.fromEntries(["vehicleCategory", "seats", "luggage"].map((k) => [k, str(fd, k) || undefined])),
      availableFrom: localDate(fd, "availableFrom"),
      availableUntil: localDate(fd, "availableUntil"),
    });
    return withParam("/boerse?view=rueckfahrten", "ok", "Fahrt veröffentlicht. Sie ist noch als unverbindlich markiert.");
  });
}

export async function setCapacityStatusAction(fd: FormData) {
  await runAction("/boerse?view=rueckfahrten", async () => {
    await setCapacityStatus(await getActor(), str(fd, "offerId"), str(fd, "status") === "CONFIRMED" ? "CONFIRMED" : "WITHDRAWN");
  });
}
