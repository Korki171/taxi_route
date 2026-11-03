-- CreateEnum
CREATE TYPE "RequestVisibility" AS ENUM ('MARKET', 'INVITED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'RESPONDED', 'DECLINED');

-- AlterTable
ALTER TABLE "TransferRequest" ADD COLUMN     "visibility" "RequestVisibility" NOT NULL DEFAULT 'MARKET';

-- CreateTable
CREATE TABLE "QuoteInvitation" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "providerOrgId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "declineNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "QuoteInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuoteInvitation_providerOrgId_status_idx" ON "QuoteInvitation"("providerOrgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteInvitation_requestId_providerOrgId_key" ON "QuoteInvitation"("requestId", "providerOrgId");

-- AddForeignKey
ALTER TABLE "QuoteInvitation" ADD CONSTRAINT "QuoteInvitation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "TransferRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteInvitation" ADD CONSTRAINT "QuoteInvitation_providerOrgId_fkey" FOREIGN KEY ("providerOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Neue Tabelle wie alle anderen gegen Zugriff über die Supabase Data API sperren (siehe supabase_lockdown).
ALTER TABLE "QuoteInvitation" ENABLE ROW LEVEL SECURITY;
