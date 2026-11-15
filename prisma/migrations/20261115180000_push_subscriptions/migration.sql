-- CreateEnum
CREATE TYPE "PushPlatform" AS ENUM ('WEB', 'IOS', 'ANDROID');

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sessionId" TEXT,
    "platform" "PushPlatform" NOT NULL DEFAULT 'WEB',
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT,
    "auth" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSentAt" TIMESTAMP(3),

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_organizationId_idx" ON "PushSubscription"("organizationId");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Neue Tabelle wie alle anderen gegen Zugriff über die Supabase Data API sperren (siehe supabase_lockdown).
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;
