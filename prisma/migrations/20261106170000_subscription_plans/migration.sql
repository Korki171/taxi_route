-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('BASIS', 'PRO', 'FLOTTE');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "plan" "SubscriptionPlan",
ADD COLUMN     "planFreeUntil" TIMESTAMP(3),
ADD COLUMN     "planNote" TEXT,
ADD COLUMN     "planUpdatedAt" TIMESTAMP(3);

