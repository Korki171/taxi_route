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
import {
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
    const s = await login({ email: str(fd, "email"), password: str(fd, "password") });
    await setSessionCookie(s.token, s.expiresAt);
    // Nur interne Pfade als Rücksprungziel (kein Open Redirect).
    return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
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

