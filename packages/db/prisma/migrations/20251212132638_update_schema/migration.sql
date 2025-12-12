/*
  Warnings:

  - You are about to drop the column `event` on the `DailyStat` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."DailyStat" DROP COLUMN "event",
ADD COLUMN     "eventType" TEXT,
ADD COLUMN     "os" TEXT,
ADD COLUMN     "pageTitle" TEXT;
