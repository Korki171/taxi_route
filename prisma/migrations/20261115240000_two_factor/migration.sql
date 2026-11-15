-- Zwei-Faktor-Anmeldung: Code per E-Mail, je Nutzer einschaltbar
ALTER TABLE "User" ADD COLUMN "twoFactorEmail" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "LoginChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LoginChallenge_userId_idx" ON "LoginChallenge"("userId");

ALTER TABLE "LoginChallenge" ADD CONSTRAINT "LoginChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LoginChallenge" ENABLE ROW LEVEL SECURITY;
