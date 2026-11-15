-- Ausschreibungen: Saison- und Gruppentransfers zum festen Preis je Fahrt.
CREATE TYPE "TenderStatus" AS ENUM ('OPEN', 'AWARDED', 'CLOSED');

CREATE TABLE "Tender" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "requesterOrgId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "pickupPlaceId" TEXT NOT NULL,
    "dropoffPlaceId" TEXT NOT NULL,
    "bothDirections" BOOLEAN NOT NULL DEFAULT true,
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "estimatedTrips" INTEGER NOT NULL,
    "passengers" INTEGER,
    "vehicleCategory" "VehicleCategory",
    "notes" TEXT,
    "bidDeadline" TIMESTAMP(3) NOT NULL,
    "status" "TenderStatus" NOT NULL DEFAULT 'OPEN',
    "awardedBidId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tender_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TenderBid" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "providerOrgId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "pricePerTripCents" INTEGER NOT NULL,
    "message" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenderBid_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tender_number_key" ON "Tender"("number");
CREATE UNIQUE INDEX "Tender_awardedBidId_key" ON "Tender"("awardedBidId");
CREATE INDEX "Tender_requesterOrgId_idx" ON "Tender"("requesterOrgId");
CREATE INDEX "Tender_status_bidDeadline_idx" ON "Tender"("status", "bidDeadline");
CREATE INDEX "TenderBid_providerOrgId_idx" ON "TenderBid"("providerOrgId");
CREATE UNIQUE INDEX "TenderBid_tenderId_providerOrgId_key" ON "TenderBid"("tenderId", "providerOrgId");

ALTER TABLE "Tender" ADD CONSTRAINT "Tender_requesterOrgId_fkey" FOREIGN KEY ("requesterOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Tender" ADD CONSTRAINT "Tender_awardedBidId_fkey" FOREIGN KEY ("awardedBidId") REFERENCES "TenderBid"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TenderBid" ADD CONSTRAINT "TenderBid_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TenderBid" ADD CONSTRAINT "TenderBid_providerOrgId_fkey" FOREIGN KEY ("providerOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Neue Tabellen wie alle anderen gegen Zugriff über die Supabase Data API sperren (siehe supabase_lockdown).
ALTER TABLE "Tender" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenderBid" ENABLE ROW LEVEL SECURITY;
