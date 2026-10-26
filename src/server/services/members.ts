import type { MemberRole } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword } from "../auth/password";
import { generateToken, hashToken } from "../auth/tokens";
import { requirePermission, type Actor } from "../authz/context";
import { assignableRoles } from "../authz/permissions";
import { AppError, conflict, forbidden, invalid, notFound } from "../errors";
import { emailSchema, memberRoleSchema, parse, userInputSchema } from "../validation";
import { audit } from "./audit";
import { z } from "zod";

export const INVITATION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export async function listMembers(actor: Actor | null) {
  requirePermission(actor, "members.read");
  return db.membership.findMany({
    where: { organizationId: actor.org.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true, status: true } },
    },
  });
}

export async function listInvitations(actor: Actor | null) {
  requirePermission(actor, "members.manage");
  return db.invitation.findMany({
    where: { organizationId: actor.org.id, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
  });
}

/**
 * Erstellt eine Einladung. Das Klartext-Token wird nur einmal zurückgegeben
 * (MVP: der Link wird angezeigt; E-Mail-Versand folgt in Phase 5).
 */
export async function inviteMember(actor: Actor | null, input: unknown) {
  requirePermission(actor, "members.manage");
  const { email, role } = parse(z.object({ email: emailSchema, role: memberRoleSchema }), input);
  if (!assignableRoles(actor.org.role).includes(role)) {
    throw forbidden("Sie dürfen diese Rolle nicht vergeben.");
  }
  const existing = await db.membership.findFirst({
    where: { organizationId: actor.org.id, user: { email } },
  });
  if (existing) throw conflict("Diese Person ist bereits Mitglied.");

  const token = generateToken();
  const invitation = await db.invitation.create({
    data: {
      organizationId: actor.org.id,
      email,
      role,
      tokenHash: hashToken(token),
      invitedById: actor.userId,
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
    },
  });
  await audit(db, {
    actorUserId: actor.userId,
    organizationId: actor.org.id,
    action: "member.invited",
    targetType: "Invitation",
    targetId: invitation.id,
    data: { email, role },
  });
  return { invitation, token };
}

export async function revokeInvitation(actor: Actor | null, invitationId: string) {
  requirePermission(actor, "members.manage");
  const res = await db.invitation.updateMany({
    where: { id: invitationId, organizationId: actor.org.id, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (res.count === 0) throw notFound();
  await audit(db, {
    actorUserId: actor.userId,
    organizationId: actor.org.id,
    action: "member.invitation_revoked",
    targetId: invitationId,
  });
}

async function findOpenInvitation(token: string) {
  const inv = await db.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { organization: { select: { id: true, name: true, type: true } } },
  });
  if (!inv || inv.acceptedAt || inv.revokedAt || inv.expiresAt <= new Date()) {
    throw notFound("Die Einladung ist ungültig oder abgelaufen.");
  }
  return inv;
}

export async function getInvitationPreview(token: string) {
  const inv = await findOpenInvitation(token);
  return { email: inv.email, role: inv.role, organization: inv.organization };
}

async function consumeInvitation(
  tx: Prisma.TransactionClient,
  invitationId: string,
  userId: string,
  organizationId: string,
  role: MemberRole,
) {
  // Bedingtes Update verhindert doppelte Einlösung bei parallelen Anfragen.
  const res = await tx.invitation.updateMany({
    where: { id: invitationId, acceptedAt: null, revokedAt: null },
    data: { acceptedAt: new Date() },
  });
  if (res.count !== 1) throw notFound("Die Einladung wurde bereits verwendet.");
  await tx.membership.create({ data: { userId, organizationId, role } });
  await audit(tx, {
    actorUserId: userId,
    organizationId,
    action: "member.joined",
    targetType: "Invitation",
    targetId: invitationId,
    data: { role },
  });
}

/** Einladung durch einen bereits angemeldeten Nutzer annehmen. E-Mail muss übereinstimmen. */
export async function acceptInvitation(actor: Actor | null, token: string) {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Bitte melden Sie sich an.");
  const inv = await findOpenInvitation(token);
  if (inv.email !== actor.email.toLowerCase()) {
    throw forbidden("Diese Einladung gilt für eine andere E-Mail-Adresse.");
  }
  try {
    await db.$transaction((tx) => consumeInvitation(tx, inv.id, actor.userId, inv.organizationId, inv.role));
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw conflict("Sie sind bereits Mitglied dieser Organisation.");
    }
    throw e;
  }
  return inv.organizationId;
}

/** Neues Konto über eine Einladung anlegen (E-Mail kommt aus der Einladung). */
export async function registerViaInvitation(token: string, input: unknown) {
  const inv = await findOpenInvitation(token);
  const { name, password } = parse(userInputSchema.omit({ email: true }), input);
  const passwordHash = await hashPassword(password);
  try {
    return await db.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email: inv.email, name, passwordHash } });
      await consumeInvitation(tx, inv.id, user.id, inv.organizationId, inv.role);
      return { user, organizationId: inv.organizationId };
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw conflict("Für diese E-Mail existiert bereits ein Konto. Bitte melden Sie sich an.");
    }
    throw e;
  }
}

async function loadTargetMembership(actor: Actor & { org: NonNullable<Actor["org"]> }, membershipId: string) {
  // Immer auf die eigene Organisation einschränken: fremde IDs liefern "nicht gefunden".
  const m = await db.membership.findFirst({ where: { id: membershipId, organizationId: actor.org.id } });
  if (!m) throw notFound();
  return m;
}

async function ensureNotLastOwner(tx: Prisma.TransactionClient, organizationId: string) {
  const owners = await tx.membership.count({ where: { organizationId, role: "OWNER" } });
  if (owners < 1) throw invalid("Eine Organisation braucht mindestens einen Inhaber.");
}

export async function changeMemberRole(actor: Actor | null, membershipId: string, newRole: unknown) {
  requirePermission(actor, "members.manage");
  const role = parse(memberRoleSchema, newRole);
  const target = await loadTargetMembership(actor, membershipId);
  const allowed = assignableRoles(actor.org.role);
  if (!allowed.includes(role) || !allowed.includes(target.role)) {
    throw forbidden("Sie dürfen diese Rolle nicht vergeben.");
  }
  return db.$transaction(async (tx) => {
    const updated = await tx.membership.update({ where: { id: target.id }, data: { role } });
    await ensureNotLastOwner(tx, actor.org.id);
    await audit(tx, {
      actorUserId: actor.userId,
      organizationId: actor.org.id,
      action: "member.role_changed",
      targetType: "Membership",
      targetId: target.id,
      data: { from: target.role, to: role },
    });
    return updated;
  });
}

export async function removeMember(actor: Actor | null, membershipId: string) {
  requirePermission(actor, "members.manage");
  const target = await loadTargetMembership(actor, membershipId);
  if (!assignableRoles(actor.org.role).includes(target.role)) {
    throw forbidden("Sie dürfen dieses Mitglied nicht entfernen.");
  }
  await db.$transaction(async (tx) => {
    await tx.membership.delete({ where: { id: target.id } });
    await ensureNotLastOwner(tx, actor.org.id);
    // Laufende Sessions dürfen nicht weiter auf diese Organisation zeigen.
    await tx.session.updateMany({
      where: { userId: target.userId, activeOrgId: actor.org.id },
      data: { activeOrgId: null },
    });
    await audit(tx, {
      actorUserId: actor.userId,
      organizationId: actor.org.id,
      action: "member.removed",
      targetType: "Membership",
      targetId: target.id,
      data: { userId: target.userId, role: target.role },
    });
  });
}
