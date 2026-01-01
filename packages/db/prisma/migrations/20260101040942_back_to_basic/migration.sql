/*
  Warnings:

  - You are about to drop the column `IpAddress` on the `DailyStat` table. All the data in the column will be lost.
  - You are about to drop the `DailyBreakdown` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HourlySiteStat` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HourlyVisitor` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."DailyBreakdown" DROP CONSTRAINT "DailyBreakdown_siteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."HourlySiteStat" DROP CONSTRAINT "HourlySiteStat_siteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."HourlyVisitor" DROP CONSTRAINT "HourlyVisitor_siteId_fkey";

-- AlterTable
ALTER TABLE "public"."DailyStat" DROP COLUMN "IpAddress";

-- DropTable
DROP TABLE "public"."DailyBreakdown";

-- DropTable
DROP TABLE "public"."HourlySiteStat";

-- DropTable
DROP TABLE "public"."HourlyVisitor";
