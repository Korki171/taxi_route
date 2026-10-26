-- CreateEnum
CREATE TYPE "PriceMode" AS ENUM ('FIXED', 'NEGOTIABLE');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('SUBMITTED', 'WITHDRAWN', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "CapacityStatus" AS ENUM ('PLANNED', 'CONFIRMED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" "VehicleCategory" NOT NULL,
    "licensePlate" TEXT,
    "seats" INTEGER NOT NULL,
    "luggage" INTEGER NOT NULL,
    "skiCapacity" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferRequest" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "requesterOrgId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'OPEN',
    "pickupPlaceId" TEXT NOT NULL,
    "dropoffPlaceId" TEXT NOT NULL,
    "pickupAddress" TEXT,
    "dropoffAddress" TEXT,
    "pickupAt" TIMESTAMP(3) NOT NULL,
    "pickupWindowMinutes" INTEGER NOT NULL DEFAULT 0,
    "estimatedMinutes" INTEGER,
    "passengers" INTEGER NOT NULL,
    "luggage" INTEGER NOT NULL DEFAULT 0,
    "skiEquipment" INTEGER NOT NULL DEFAULT 0,
    "specialLuggage" TEXT,
    "vehicleCategory" "VehicleCategory",
    "childSeats" INTEGER NOT NULL DEFAULT 0,
    "requirements" TEXT,
    "flightNumber" TEXT,
    "flightArrivalAt" TIMESTAMP(3),
    "pickupNotes" TEXT,
    "priceMode" "PriceMode" NOT NULL,
    "priceCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "quoteDeadline" TIMESTAMP(3),
    "bookingTerms" TEXT,
    "cancellationTerms" TEXT,
    "clientReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassengerContact" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,

    CONSTRAINT "PassengerContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "providerOrgId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "vehicleCategory" "VehicleCategory" NOT NULL,
    "message" TEXT,
    "validUntil" TIMESTAMP(3),
    "status" "QuoteStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "quoteId" TEXT,
    "requesterOrgId" TEXT NOT NULL,
    "providerOrgId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "capacityOfferId" TEXT,
    "agreedPriceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "scope" JSONB NOT NULL,
    "cancellationTerms" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedById" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completionNote" TEXT,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorOrgId" TEXT,
    "actorUserId" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapacityOffer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "vehicleId" TEXT,
    "vehicleCategory" "VehicleCategory" NOT NULL,
    "fromPlaceId" TEXT NOT NULL,
    "toPlaceId" TEXT NOT NULL,
    "availableFrom" TIMESTAMP(3) NOT NULL,
    "availableUntil" TIMESTAMP(3) NOT NULL,
    "seats" INTEGER NOT NULL,
    "luggage" INTEGER NOT NULL,
    "maxDetourMinutes" INTEGER NOT NULL DEFAULT 20,
    "maxWaitMinutes" INTEGER NOT NULL DEFAULT 60,
    "note" TEXT,
    "status" "CapacityStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapacityOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vehicle_organizationId_idx" ON "Vehicle"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "TransferRequest_number_key" ON "TransferRequest"("number");

-- CreateIndex
CREATE INDEX "TransferRequest_status_pickupAt_idx" ON "TransferRequest"("status", "pickupAt");

-- CreateIndex
CREATE INDEX "TransferRequest_requesterOrgId_idx" ON "TransferRequest"("requesterOrgId");

-- CreateIndex
CREATE INDEX "PassengerContact_requestId_idx" ON "PassengerContact"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_requestId_providerOrgId_key" ON "Quote"("requestId", "providerOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_requestId_key" ON "Booking"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_quoteId_key" ON "Booking"("quoteId");

-- CreateIndex
CREATE INDEX "Booking_providerOrgId_idx" ON "Booking"("providerOrgId");

-- CreateIndex
CREATE INDEX "Booking_requesterOrgId_idx" ON "Booking"("requesterOrgId");

-- CreateIndex
CREATE INDEX "TransferEvent_requestId_createdAt_idx" ON "TransferEvent"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "CapacityOffer_status_availableFrom_idx" ON "CapacityOffer"("status", "availableFrom");

-- CreateIndex
CREATE INDEX "CapacityOffer_organizationId_idx" ON "CapacityOffer"("organizationId");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_requesterOrgId_fkey" FOREIGN KEY ("requesterOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PassengerContact" ADD CONSTRAINT "PassengerContact_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "TransferRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "TransferRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_providerOrgId_fkey" FOREIGN KEY ("providerOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "TransferRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_requesterOrgId_fkey" FOREIGN KEY ("requesterOrgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_providerOrgId_fkey" FOREIGN KEY ("providerOrgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferEvent" ADD CONSTRAINT "TransferEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "TransferRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapacityOffer" ADD CONSTRAINT "CapacityOffer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapacityOffer" ADD CONSTRAINT "CapacityOffer_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
