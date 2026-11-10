-- CreateEnum
CREATE TYPE "Audience" AS ENUM ('OWN', 'PARTNERS', 'MARKET');

-- AlterTable
ALTER TABLE "TransferRequest" ADD COLUMN "audience" "Audience" NOT NULL DEFAULT 'MARKET',
ADD COLUMN "audienceSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "escalateAfterMinutes" INTEGER;

-- CreateTable
CREATE TABLE "PartnerLink" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "partnerOrgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartnerLink_partnerOrgId_idx" ON "PartnerLink"("partnerOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerLink_orgId_partnerOrgId_key" ON "PartnerLink"("orgId", "partnerOrgId");

-- AddForeignKey
ALTER TABLE "PartnerLink" ADD CONSTRAINT "PartnerLink_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerLink" ADD CONSTRAINT "PartnerLink_partnerOrgId_fkey" FOREIGN KEY ("partnerOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Neue Tabelle wie alle anderen gegen Zugriff über die Supabase Data API sperren (siehe supabase_lockdown).
ALTER TABLE "PartnerLink" ENABLE ROW LEVEL SECURITY;
