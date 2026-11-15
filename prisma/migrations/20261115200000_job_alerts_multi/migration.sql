-- Suchagent: mehrere gespeicherte Strecken je Betrieb statt einer.
CREATE TABLE "JobAlert" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fromPlaceId" TEXT,
    "toPlaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobAlert_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JobAlert_organizationId_idx" ON "JobAlert"("organizationId");

ALTER TABLE "JobAlert" ADD CONSTRAINT "JobAlert_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Bisher gespeicherte Strecke übernehmen
INSERT INTO "JobAlert" ("id", "organizationId", "fromPlaceId", "toPlaceId")
SELECT replace((gen_random_uuid())::text, '-', ''), "id", "alertFromPlaceId", "alertToPlaceId"
FROM "Organization" WHERE "alertFromPlaceId" IS NOT NULL OR "alertToPlaceId" IS NOT NULL;

ALTER TABLE "Organization" DROP COLUMN "alertFromPlaceId", DROP COLUMN "alertToPlaceId";

-- Neue Tabelle wie alle anderen gegen Zugriff über die Supabase Data API sperren (siehe supabase_lockdown).
ALTER TABLE "JobAlert" ENABLE ROW LEVEL SECURITY;
