import type {
  Capability,
  MemberRole,
  OrganizationStatus,
  OrganizationType,
  VerificationStatus,
} from "@prisma/client";
import { db } from "@/lib/db";
import { AppError, forbidden } from "../errors";
import { decide, type OrgAuthzInput, type Permission } from "./permissions";

/** Alles, was serverseitig über den handelnden Nutzer bekannt ist. */
export type Actor = {
  userId: string;
  email: string;
  name: string;
  isPlatformAdmin: boolean;
  org: {
    id: string;
    name: string;
    type: OrganizationType;
    status: OrganizationStatus;
    role: MemberRole;
    capabilities: Partial<Record<Capability, VerificationStatus>>;
  } | null;
};

/**
 * Lädt den Akteur frisch aus der Datenbank. Rolle und Verifizierungsstatus werden
 * NIE aus Cookie oder Formular übernommen, sondern bei jeder Anfrage neu gelesen.
 */
export async function loadActor(userId: string, activeOrgId: string | null): Promise<Actor | null> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== "ACTIVE") return null;

  let membership = activeOrgId
    ? await db.membership.findUnique({
        where: { userId_organizationId: { userId, organizationId: activeOrgId } },
        include: { organization: { include: { capabilities: true } } },
      })
    : null;
  // Fallback: erste Mitgliedschaft, falls die aktive Organisation nicht (mehr) passt.
  membership ??= await db.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { organization: { include: { capabilities: true } } },
  });

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    isPlatformAdmin: user.isPlatformAdmin,
    org: membership
      ? {
          id: membership.organization.id,
          name: membership.organization.name,
          type: membership.organization.type,
          status: membership.organization.status,
          role: membership.role,
          capabilities: Object.fromEntries(
            membership.organization.capabilities.map((c) => [c.capability, c.status]),
          ),
        }
      : null,
  };
}

export type OrgActor = Actor & { org: NonNullable<Actor["org"]> };

export function authzInput(actor: OrgActor): OrgAuthzInput {
  return { role: actor.org.role, orgStatus: actor.org.status, capabilities: actor.org.capabilities };
}

export function actorCan(actor: Actor, permission: Permission): boolean {
  return !!actor.org && decide(authzInput(actor as OrgActor), permission).allowed;
}

/** Wirft, wenn der Akteur die Berechtigung in seiner aktiven Organisation nicht hat. */
export function requirePermission(actor: Actor | null, permission: Permission): asserts actor is OrgActor {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Bitte melden Sie sich an.");
  if (!actor.org) throw forbidden("Sie gehören keiner Organisation an.");
  const d = decide(authzInput(actor as OrgActor), permission);
  if (!d.allowed) throw forbidden(d.reason);
}

export function requirePlatformAdmin(actor: Actor | null): asserts actor is Actor {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Bitte melden Sie sich an.");
  if (!actor.isPlatformAdmin) throw forbidden("Nur für Plattformadministratoren.");
}
