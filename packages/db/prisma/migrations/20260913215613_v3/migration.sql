/*
  Warnings:

  - The values [WEEKLY_REPORT] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `date` on the `notification` table. All the data in the column will be lost.
  - You are about to drop the `Domain` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PageHidden` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PageVisit` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DomainType" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "DomainState" AS ENUM ('ACTIVE', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('REACTIVATE', 'EXTEND');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('SPIKE_ALERT', 'DOMAIN_EXPIRING', 'DOMAIN_EXPIRED', 'BILLING', 'SYSTEM');
ALTER TABLE "notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Domain" DROP CONSTRAINT "Domain_userId_fkey";

-- DropForeignKey
ALTER TABLE "PageHidden" DROP CONSTRAINT "PageHidden_domainId_fkey";

-- DropForeignKey
ALTER TABLE "PageVisit" DROP CONSTRAINT "PageVisit_domainId_fkey";

-- AlterTable
ALTER TABLE "notification" DROP COLUMN "date";

-- DropTable
DROP TABLE "Domain";

-- DropTable
DROP TABLE "PageHidden";

-- DropTable
DROP TABLE "PageVisit";

-- CreateTable
CREATE TABLE "pricing_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "paidDomainPrice" INTEGER NOT NULL DEFAULT 2000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domainName" TEXT NOT NULL,
    "apikey" TEXT NOT NULL,
    "type" "DomainType" NOT NULL DEFAULT 'FREE',
    "state" "DomainState" NOT NULL DEFAULT 'ACTIVE',
    "endsAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "defaultTimezone" TEXT NOT NULL DEFAULT 'UTC',
    "expectedVisitors" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "purpose" "PaymentPurpose" NOT NULL,
    "amount" INTEGER NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_visit" (
    "id" TEXT NOT NULL,
    "domainName" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT,
    "page" TEXT NOT NULL,
    "pageTitle" TEXT,
    "referrer" TEXT,
    "country" TEXT,
    "city" TEXT,
    "browser" TEXT,
    "device" TEXT,
    "os" TEXT,
    "exitType" TEXT,
    "timeSpent" INTEGER NOT NULL,

    CONSTRAINT "page_visit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "domain_domainName_key" ON "domain"("domainName");

-- CreateIndex
CREATE UNIQUE INDEX "domain_apikey_key" ON "domain"("apikey");

-- CreateIndex
CREATE INDEX "domain_userId_idx" ON "domain"("userId");

-- CreateIndex
CREATE INDEX "domain_userId_state_idx" ON "domain"("userId", "state");

-- CreateIndex
CREATE INDEX "domain_state_endsAt_idx" ON "domain"("state", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_razorpayOrderId_key" ON "payment"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_razorpayPaymentId_key" ON "payment"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "payment_userId_idx" ON "payment"("userId");

-- CreateIndex
CREATE INDEX "payment_domainId_idx" ON "payment"("domainId");

-- CreateIndex
CREATE INDEX "page_visit_domainId_visitedAt_idx" ON "page_visit"("domainId", "visitedAt");

-- CreateIndex
CREATE INDEX "page_visit_domainId_visitorId_idx" ON "page_visit"("domainId", "visitorId");

-- CreateIndex
CREATE INDEX "page_visit_domainId_page_idx" ON "page_visit"("domainId", "page");

-- AddForeignKey
ALTER TABLE "domain" ADD CONSTRAINT "domain_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_visit" ADD CONSTRAINT "page_visit_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
