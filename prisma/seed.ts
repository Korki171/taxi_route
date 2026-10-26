/**
 * Legt einen Plattformadministrator an (Zugangsdaten aus Umgebungsvariablen).
 * Optional mit SEED_DEMO=1 zwei Demo-Organisationen (ungeprüft) für lokale Tests.
 *
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=... npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/server/auth/password";

const db = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error("ADMIN_EMAIL und ADMIN_PASSWORD (mind. 12 Zeichen) setzen.");
  }
  await db.user.upsert({
    where: { email },
    create: { email, name: "Plattform-Admin", passwordHash: await hashPassword(password), isPlatformAdmin: true },
    update: { isPlatformAdmin: true },
  });
  console.log(`Plattformadmin ${email} ist eingerichtet.`);

  if (process.env.SEED_DEMO === "1") {
    const demo = [
      { type: "TRANSPORT_COMPANY" as const, name: "Demo Taxi Innsbruck", email: "taxi@demo.test", city: "Innsbruck" },
      { type: "TRAVEL_AGENCY" as const, name: "Demo Reisebüro Kitzbühel", email: "reise@demo.test", city: "Kitzbühel" },
    ];
    for (const d of demo) {
      if (await db.user.findUnique({ where: { email: d.email } })) continue;
      const user = await db.user.create({
        data: { email: d.email, name: `Inhaber ${d.name}`, passwordHash: await hashPassword("demo-passwort-123") },
      });
      await db.organization.create({
        data: {
          type: d.type,
          name: d.name,
          street: "Demostraße 1",
          postalCode: "6020",
          city: d.city,
          country: "AT",
          email: d.email,
          phone: "+43 000 000",
          capabilities: {
            create: (d.type === "TRANSPORT_COMPANY" ? ["TRANSPORT_PROVIDER", "TRANSFER_BOOKER"] : ["TRANSFER_BOOKER"]).map(
              (capability) => ({ capability: capability as "TRANSPORT_PROVIDER" | "TRANSFER_BOOKER" }),
            ),
          },
          memberships: { create: { userId: user.id, role: "OWNER" } },
          transportProfile: d.type === "TRANSPORT_COMPANY" ? { create: { vehicleCategories: [], declaredRegions: [] } } : undefined,
        },
      });
      console.log(`Demo: ${d.email} / demo-passwort-123`);
    }
  }
}

main().finally(() => db.$disconnect());
