-- Mehrere Standorte je Betrieb (Orte aus dem Ortskatalog).
CREATE TABLE "OrgLocation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgLocation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrgLocation_organizationId_placeId_key" ON "OrgLocation"("organizationId", "placeId");

ALTER TABLE "OrgLocation" ADD CONSTRAINT "OrgLocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Neue Tabelle wie alle anderen gegen Zugriff über die Supabase Data API sperren (siehe supabase_lockdown).
ALTER TABLE "OrgLocation" ENABLE ROW LEVEL SECURITY;
