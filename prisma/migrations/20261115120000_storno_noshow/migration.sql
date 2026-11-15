-- Storno- und No-Show-Regeln: feste Stornoregel am Auftrag, Gebühr und Storno-Zeitpunkt an der Buchung,
-- neuer Status „Nicht erschienen“. Nur Ergänzungen, keine bestehenden Daten werden verändert.

ALTER TYPE "BookingStatus" ADD VALUE 'NO_SHOW';
ALTER TYPE "TransferStatus" ADD VALUE 'NO_SHOW';

ALTER TABLE "TransferRequest" ADD COLUMN "freeCancelHours" INTEGER,
ADD COLUMN "lateCancelPercent" INTEGER;

ALTER TABLE "Booking" ADD COLUMN "freeCancelHours" INTEGER,
ADD COLUMN "lateCancelPercent" INTEGER,
ADD COLUMN "feeCents" INTEGER,
ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "cancelledByOrgId" TEXT;
