-- AlterTable
ALTER TABLE "public"."Site" ADD COLUMN     "expectedViewsIn5min" INTEGER DEFAULT 100,
ADD COLUMN     "viewsIn5min" INTEGER DEFAULT 0;
