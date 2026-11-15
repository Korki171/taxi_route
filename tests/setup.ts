import { afterAll, beforeAll, beforeEach } from "vitest";
import { db } from "@/lib/db";

// Die Tests leeren vor jedem Fall alle Tabellen. Das darf nur in der Testdatenbank passieren:
// lokal (localhost) oder in einem eigenen Schema (z. B. ?schema=tb_test), nie im Schema „public“
// einer entfernten Datenbank, in dem die echten Daten liegen.
let schema = "public";

beforeAll(async () => {
  const [row] = await db.$queryRaw<{ s: string }[]>`SELECT current_schema() AS s`;
  schema = row.s;
  const url = process.env.DATABASE_URL ?? "";
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  if (schema === "public" && !local) {
    throw new Error("Tests abgebrochen: DATABASE_URL zeigt auf das Schema „public“ einer entfernten Datenbank. Bitte ein eigenes Test-Schema angeben (?schema=…).");
  }
});

beforeEach(async () => {
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = ${schema} AND tablename <> '_prisma_migrations'`;
  if (tables.length) {
    await db.$executeRawUnsafe(
      `TRUNCATE ${tables.map((t) => `"${schema}"."${t.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`,
    );
  }
});

afterAll(async () => {
  await db.$disconnect();
});
