/*
  Warnings:

  - You are about to drop the column `expectedViewsIn5min` on the `Domain` table. All the data in the column will be lost.
  - You are about to drop the column `viewsIn5min` on the `Domain` table. All the data in the column will be lost.
  - You are about to drop the `DailyStat` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[apikey]` on the table `Domain` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `apikey` to the `Domain` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DailyStat" DROP CONSTRAINT "DailyStat_domainID_fkey";

-- AlterTable
ALTER TABLE "Domain" DROP COLUMN "expectedViewsIn5min",
DROP COLUMN "viewsIn5min",
ADD COLUMN     "apikey" TEXT NOT NULL,
ADD COLUMN     "expectedVisitors" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "DailyStat";

-- CreateTable
CREATE TABLE "PageVisit" (
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
    "browser" TEXT,
    "device" TEXT,
    "os" TEXT,
    "timeSpent" INTEGER NOT NULL,

    CONSTRAINT "PageVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageVisit_domainId_visitedAt_idx" ON "PageVisit"("domainId", "visitedAt");

-- CreateIndex
CREATE INDEX "PageVisit_domainId_visitorId_idx" ON "PageVisit"("domainId", "visitorId");

-- CreateIndex
CREATE INDEX "PageVisit_domainId_page_idx" ON "PageVisit"("domainId", "page");

-- CreateIndex
CREATE UNIQUE INDEX "Domain_apikey_key" ON "Domain"("apikey");

-- CreateIndex
CREATE INDEX "Domain_userId_idx" ON "Domain"("userId");

-- AddForeignKey
ALTER TABLE "PageVisit" ADD CONSTRAINT "PageVisit_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
