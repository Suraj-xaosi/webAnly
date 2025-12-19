-- DropForeignKey
ALTER TABLE "public"."DailyStat" DROP CONSTRAINT "DailyStat_siteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Site" DROP CONSTRAINT "Site_userId_fkey";

-- AddForeignKey
ALTER TABLE "public"."Site" ADD CONSTRAINT "Site_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyStat" ADD CONSTRAINT "DailyStat_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HourlySiteStat" ADD CONSTRAINT "HourlySiteStat_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HourlyVisitor" ADD CONSTRAINT "HourlyVisitor_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyBreakdown" ADD CONSTRAINT "DailyBreakdown_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
