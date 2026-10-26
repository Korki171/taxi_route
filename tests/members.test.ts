import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { loadActor } from "@/server/authz/context";
import {
  acceptInvitation,
  changeMemberRole,
  getInvitationPreview,
  inviteMember,
  listMembers,
  registerViaInvitation,
  removeMember,
  revokeInvitation,
} from "@/server/services/members";
import { addMember, register } from "./helpers";

describe("Mitarbeiterverwaltung", () => {
  it("Reisebüro lädt Mitarbeiter ein, dieser registriert sich über den Link", async () => {
    const { actor, org } = await register("TRAVEL_AGENCY");
    const { token } = await inviteMember(actor, { email: "Anna@Example.com", role: "BOOKER" });
    expect((await getInvitationPreview(token)).email).toBe("anna@example.com");

    const { user } = await registerViaInvitation(token, { name: "Anna", password: "anna-passwort-1" });
    const anna = await loadActor(user.id, org.id);
    expect(anna?.org?.role).toBe("BOOKER");
    // Einladung ist verbraucht
    await expect(registerViaInvitation(token, { name: "X", password: "noch-ein-passwort" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("Einladung kann nur mit passender E-Mail angenommen werden", async () => {
    const { actor } = await register("TRAVEL_AGENCY");
    const other = await register("TRANSPORT_COMPANY");
    const { token } = await inviteMember(actor, { email: "jemand@example.com", role: "VIEWER" });
    await expect(acceptInvitation(other.actor, token)).rejects.toMatchObject({ code: "FORBIDDEN" });

    const { token: t2 } = await inviteMember(actor, { email: other.user.email, role: "VIEWER" });
    await acceptInvitation(other.actor, t2);
    expect(await db.membership.count({ where: { userId: other.user.id } })).toBe(2);
  });

  it("widerrufene und abgelaufene Einladungen sind ungültig", async () => {
    const { actor } = await register("TRAVEL_AGENCY");
    const { invitation, token } = await inviteMember(actor, { email: "a@example.com", role: "VIEWER" });
    await revokeInvitation(actor, invitation.id);
    await expect(getInvitationPreview(token)).rejects.toMatchObject({ code: "NOT_FOUND" });

    const { invitation: i2, token: t2 } = await inviteMember(actor, { email: "b@example.com", role: "VIEWER" });
    await db.invitation.update({ where: { id: i2.id }, data: { expiresAt: new Date(Date.now() - 1) } });
    await expect(getInvitationPreview(t2)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("nur berechtigte Rollen verwalten Mitglieder; keine Rechteausweitung", async () => {
    const { org } = await register("TRANSPORT_COMPANY");
    const dispatcher = await addMember(org.id, "DISPATCHER");
    await expect(inviteMember(dispatcher.actor, { email: "x@example.com", role: "VIEWER" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    const admin = await addMember(org.id, "ADMIN");
    await expect(inviteMember(admin.actor, { email: "x@example.com", role: "OWNER" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(changeMemberRole(admin.actor, admin.membership.id, "OWNER")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(changeMemberRole(admin.actor, dispatcher.membership.id, "ADMIN")).resolves.toMatchObject({
      role: "ADMIN",
    });
  });

  it("Admin kann den Inhaber weder herabstufen noch entfernen; letzter Inhaber bleibt", async () => {
    const owner = await register("TRAVEL_AGENCY");
    const ownerMembership = await db.membership.findFirstOrThrow({ where: { userId: owner.user.id } });
    const admin = await addMember(owner.org.id, "ADMIN");
    await expect(changeMemberRole(admin.actor, ownerMembership.id, "VIEWER")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(removeMember(admin.actor, ownerMembership.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(changeMemberRole(owner.actor, ownerMembership.id, "ADMIN")).rejects.toMatchObject({
      code: "VALIDATION",
    });
    expect((await db.membership.findUniqueOrThrow({ where: { id: ownerMembership.id } })).role).toBe("OWNER");
  });

  it("Mitglieder fremder Organisationen sind weder sichtbar noch änderbar (Szenario E)", async () => {
    const a = await register("TRAVEL_AGENCY");
    const b = await register("TRANSPORT_COMPANY");
    const bMember = await addMember(b.org.id, "VIEWER");
    const listed = await listMembers(a.actor);
    expect(listed.map((m) => m.user.id)).not.toContain(bMember.user.id);
    await expect(changeMemberRole(a.actor, bMember.membership.id, "ADMIN")).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(removeMember(a.actor, bMember.membership.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const { invitation } = await inviteMember(b.actor, { email: "z@example.com", role: "VIEWER" });
    await expect(revokeInvitation(a.actor, invitation.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("entferntes Mitglied verliert sofort den Zugriff", async () => {
    const owner = await register("TRAVEL_AGENCY");
    const m = await addMember(owner.org.id, "BOOKER");
    await removeMember(owner.actor, m.membership.id);
    const after = await loadActor(m.user.id, owner.org.id);
    expect(after?.org).toBeNull();
    await expect(listMembers(after)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
