-- CreateTable
CREATE TABLE "OrgBlock" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "blockedOrgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrgBlock_blockedOrgId_idx" ON "OrgBlock"("blockedOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgBlock_orgId_blockedOrgId_key" ON "OrgBlock"("orgId", "blockedOrgId");

-- AddForeignKey
ALTER TABLE "OrgBlock" ADD CONSTRAINT "OrgBlock_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgBlock" ADD CONSTRAINT "OrgBlock_blockedOrgId_fkey" FOREIGN KEY ("blockedOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Neue Tabelle wie alle anderen gegen Zugriff über die Supabase Data API sperren (siehe supabase_lockdown).
ALTER TABLE "OrgBlock" ENABLE ROW LEVEL SECURITY;
