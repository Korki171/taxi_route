-- CreateEnum
CREATE TYPE "TripStage" AS ENUM ('TO_PICKUP', 'AT_PICKUP', 'ON_BOARD');

-- AlterEnum
ALTER TYPE "MemberRole" ADD VALUE 'DRIVER';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "driverId" TEXT,
ADD COLUMN     "tripStage" "TripStage",
ADD COLUMN     "tripStageAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "trackingConsentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DriverShift" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "lastLat" DOUBLE PRECISION,
    "lastLng" DOUBLE PRECISION,
    "lastAccuracy" DOUBLE PRECISION,
    "lastSpeed" DOUBLE PRECISION,
    "lastHeading" DOUBLE PRECISION,
    "lastPositionAt" TIMESTAMP(3),

    CONSTRAINT "DriverShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionPing" (
    "id" BIGSERIAL NOT NULL,
    "shiftId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PositionPing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriverShift_organizationId_endedAt_idx" ON "DriverShift"("organizationId", "endedAt");

-- CreateIndex
CREATE INDEX "DriverShift_userId_endedAt_idx" ON "DriverShift"("userId", "endedAt");

-- CreateIndex
CREATE INDEX "PositionPing_shiftId_recordedAt_idx" ON "PositionPing"("shiftId", "recordedAt");

-- CreateIndex
CREATE INDEX "PositionPing_recordedAt_idx" ON "PositionPing"("recordedAt");

-- CreateIndex
CREATE INDEX "Booking_driverId_idx" ON "Booking"("driverId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverShift" ADD CONSTRAINT "DriverShift_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverShift" ADD CONSTRAINT "DriverShift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverShift" ADD CONSTRAINT "DriverShift_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionPing" ADD CONSTRAINT "PositionPing_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "DriverShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Neue Tabellen wie alle anderen gegen Zugriff über die Supabase Data API sperren (siehe supabase_lockdown).
ALTER TABLE "DriverShift" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PositionPing" ENABLE ROW LEVEL SECURITY;
