-- Bewertungen mit drei Kategorien je Rolle, verdeckt bis beide bewertet haben, Antwort, Ausblenden durch Admins
-- und Meldungen. Bestehende Bewertungen: Sterne gelten für alle Kategorien, sie bleiben sichtbar.

ALTER TABLE "Rating" ALTER COLUMN "stars" TYPE DOUBLE PRECISION USING "stars"::double precision;

ALTER TABLE "Rating" ADD COLUMN "communication" INTEGER,
ADD COLUMN "punctuality" INTEGER,
ADD COLUMN "passengerCare" INTEGER,
ADD COLUMN "fairness" INTEGER,
ADD COLUMN "payment" INTEGER,
ADD COLUMN "reply" TEXT,
ADD COLUMN "replyAt" TIMESTAMP(3),
ADD COLUMN "revealedAt" TIMESTAMP(3),
ADD COLUMN "commentHiddenAt" TIMESTAMP(3),
ADD COLUMN "commentHiddenBy" TEXT;

UPDATE "Rating" r SET
  "communication" = r."stars"::int,
  "punctuality"   = CASE WHEN b."requesterOrgId" = r."fromOrgId" THEN r."stars"::int END,
  "passengerCare" = CASE WHEN b."requesterOrgId" = r."fromOrgId" THEN r."stars"::int END,
  "fairness"      = CASE WHEN b."providerOrgId" = r."fromOrgId" THEN r."stars"::int END,
  "payment"       = CASE WHEN b."providerOrgId" = r."fromOrgId" THEN r."stars"::int END,
  "revealedAt"    = r."createdAt"
FROM "Booking" b WHERE b."id" = r."bookingId";

ALTER TABLE "Rating" ALTER COLUMN "communication" SET NOT NULL;

CREATE TABLE "RatingReport" (
    "id" TEXT NOT NULL,
    "ratingId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "RatingReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RatingReport_ratingId_orgId_key" ON "RatingReport"("ratingId", "orgId");
CREATE INDEX "RatingReport_resolvedAt_idx" ON "RatingReport"("resolvedAt");

ALTER TABLE "RatingReport" ADD CONSTRAINT "RatingReport_ratingId_fkey" FOREIGN KEY ("ratingId") REFERENCES "Rating"("id") ON DELETE CASCADE ON UPDATE CASCADE;
