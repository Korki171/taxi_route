import type { Capability, OrganizationType } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword } from "../auth/password";
import { conflict } from "../errors";
import { parse, registrationSchema } from "../validation";
import { audit } from "./audit";

/**
 * Standard-Geschäftsfunktionen je Organisationstyp. Alle starten UNVERIFIED –
 * erst der Plattformadmin schaltet sie frei. Ein Reisebüro erhält bewusst
 * KEINE Beförderungsfunktion (Szenario D); es kann sie separat beantragen.
 */
export const DEFAULT_CAPABILITIES: Record<OrganizationType, Capability[]> = {
  TRANSPORT_COMPANY: ["TRANSPORT_PROVIDER", "TRANSFER_BOOKER"],
  TRAVEL_AGENCY: ["TRANSFER_BOOKER"],
  TOUR_OPERATOR: ["TRANSFER_BOOKER"],
  HOTEL: ["TRANSFER_BOOKER"],
};

/** Registriert Nutzer + Organisation in einer Transaktion; der Nutzer wird OWNER. */
export async function registerOrganization(input: unknown) {
  const { user, organization } = parse(registrationSchema, input);
  const passwordHash = await hashPassword(user.password);

  try {
    return await db.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: { email: user.email, name: user.name, passwordHash },
      });
      const org = await tx.organization.create({
        data: {
          ...organization,
          capabilities: {
            create: DEFAULT_CAPABILITIES[organization.type].map((capability) => ({ capability })),
          },
          memberships: { create: { userId: createdUser.id, role: "OWNER" } },
          transportProfile:
            organization.type === "TRANSPORT_COMPANY"
              ? { create: { vehicleCategories: [], declaredRegions: [] } }
              : undefined,
        },
      });
      await audit(tx, {
        actorUserId: createdUser.id,
        organizationId: org.id,
        action: "organization.registered",
        targetType: "Organization",
        targetId: org.id,
        data: { type: org.type },
      });
      return { user: createdUser, organization: org };
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw conflict("Für diese E-Mail-Adresse existiert bereits ein Konto.");
    }
    throw e;
  }
}
