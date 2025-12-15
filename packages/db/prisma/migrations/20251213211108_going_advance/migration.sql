-- CreateTable
CREATE TABLE "public"."HourlySiteStat" (
    "siteId" TEXT NOT NULL,
    "hour" TIMESTAMP(3) NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "visitors" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HourlySiteStat_pkey" PRIMARY KEY ("siteId","hour")
);

-- CreateTable
CREATE TABLE "public"."HourlyVisitor" (
    "siteId" TEXT NOT NULL,
    "hour" TIMESTAMP(3) NOT NULL,
    "visitorId" TEXT NOT NULL,

    CONSTRAINT "HourlyVisitor_pkey" PRIMARY KEY ("siteId","hour","visitorId")
);

-- CreateTable
CREATE TABLE "public"."DailyBreakdown" (
    "siteId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyBreakdown_pkey" PRIMARY KEY ("siteId","date","type","key")
);

-- CreateIndex
CREATE INDEX "HourlySiteStat_siteId_hour_idx" ON "public"."HourlySiteStat"("siteId", "hour");

-- CreateIndex
CREATE INDEX "DailyBreakdown_siteId_date_type_idx" ON "public"."DailyBreakdown"("siteId", "date", "type");

-- CreateIndex
CREATE INDEX "DailyStat_siteId_date_idx" ON "public"."DailyStat"("siteId", "date");

-- CreateIndex
CREATE INDEX "DailyStat_siteId_visitorId_idx" ON "public"."DailyStat"("siteId", "visitorId");

-- CreateIndex
CREATE INDEX "DailyStat_siteId_page_idx" ON "public"."DailyStat"("siteId", "page");
