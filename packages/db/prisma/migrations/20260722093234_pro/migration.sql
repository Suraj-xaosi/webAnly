-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "defaultTimezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN     "pro" BOOLEAN NOT NULL DEFAULT true;
