-- Live-Status-Link: geheimer Schlüssel je Buchung. Bestehende Buchungen bekommen je einen eigenen Wert.
ALTER TABLE "Booking" ADD COLUMN "trackToken" TEXT NOT NULL DEFAULT replace((gen_random_uuid())::text, '-'::text, ''::text);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_trackToken_key" ON "Booking"("trackToken");
