/*
  Warnings:

  - Added the required column `visitorId` to the `DailyStat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."DailyStat" ADD COLUMN     "visitorId" TEXT NOT NULL;
