-- Abgabe-Anteil: das abgebende Unternehmen behält einen Prozentsatz vom Fahrpreis.
ALTER TABLE "TransferRequest" ADD COLUMN "handoffSharePercent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Booking" ADD COLUMN "handoffSharePercent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Booking" ADD COLUMN "handoffShareCents" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_handoffSharePercent_check" CHECK ("handoffSharePercent" BETWEEN 0 AND 100);
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_handoffShare_check" CHECK ("handoffSharePercent" BETWEEN 0 AND 100 AND "handoffShareCents" >= 0 AND "handoffShareCents" <= "agreedPriceCents");
