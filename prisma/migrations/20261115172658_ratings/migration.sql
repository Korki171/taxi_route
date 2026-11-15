-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fromOrgId" TEXT NOT NULL,
    "toOrgId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Rating_toOrgId_idx" ON "Rating"("toOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_bookingId_fromOrgId_key" ON "Rating"("bookingId", "fromOrgId");

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_toOrgId_fkey" FOREIGN KEY ("toOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Neue Tabelle wie alle anderen gegen Zugriff über die Supabase Data API sperren (siehe supabase_lockdown).
ALTER TABLE "Rating" ENABLE ROW LEVEL SECURITY;
