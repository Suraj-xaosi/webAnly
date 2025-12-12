import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

// ------------------------------
// GET /api/chart?siteId=xxx&date=YYYY-MM-DD
// ------------------------------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const siteId = searchParams.get("siteId");
    const dateString = searchParams.get("date");

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }
    if (!dateString) {
      return NextResponse.json({ error: "date is required (YYYY-MM-DD)" }, { status: 400 });
    }

    const startOfDay = new Date(`${dateString}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateString}T23:59:59.999Z`);

    // ----------------
    // Grouped charts via Prisma
    // ----------------
    const [browsers, devices, countries, pages, pageTitles, previousPage, uniqueVisitorsCount, hourlyViewsRaw] =
      await Promise.all([
        prisma.dailyStat.groupBy({
          by: ["browser"],
          _count: { browser: true },
          where: { siteId, date: { gte: startOfDay, lte: endOfDay } },
        }),
        prisma.dailyStat.groupBy({
          by: ["device"],
          _count: { device: true },
          where: { siteId, date: { gte: startOfDay, lte: endOfDay } },
        }),
        prisma.dailyStat.groupBy({
          by: ["country"],
          _count: { country: true },
          where: { siteId, date: { gte: startOfDay, lte: endOfDay } },
        }),
        prisma.dailyStat.groupBy({
          by: ["page"],
          _count: { page: true },
          where: { siteId, date: { gte: startOfDay, lte: endOfDay } },
        }),
        prisma.dailyStat.groupBy({
          by: ["pageTitle"],
          _count: { pageTitle: true },
          where: { siteId, date: { gte: startOfDay, lte: endOfDay } },
        }),
        prisma.dailyStat.groupBy({
          by: ["previousPage"],
          _count: { previousPage: true },
          where: { siteId, previousPage: { not: null }, date: { gte: startOfDay, lte: endOfDay } },
        }),
        prisma.dailyStat.groupBy({
          by: ["visitorId"],
          _count: { visitorId: true },
          where: { siteId, date: { gte: startOfDay, lte: endOfDay } },
        }),
        prisma.dailyStat.groupBy({
          by: ["date"],
          _count: { id: true },
          where: { siteId, date: { gte: startOfDay, lte: endOfDay } },
        }),
      ]);

    // ----------------
    // Transform data for frontend
    // ----------------
    const formatGroupBy = (arr: any[], key: string) =>
      arr.map((item) => ({ name: item[key] || "Unknown", views: item._count[key] }));

    const viewsData = Array.from({ length: 24 }, (_, hour) => {
      const count = hourlyViewsRaw.filter(
        (r) => new Date(r.date).getUTCHours() === hour
      ).reduce((acc, r) => acc + r._count.id, 0);
      return { interval: `${hour}:00-${hour}:59`, views: count };
    }).filter((d) => d.views > 0);

    return NextResponse.json({
      browsers: formatGroupBy(browsers, "browser"),
      devices: formatGroupBy(devices, "device"),
      countries: formatGroupBy(countries, "country"),
      pages: formatGroupBy(pages, "page"),
      pageTitles: formatGroupBy(pageTitles, "pageTitle"),
      referrers: formatGroupBy(previousPage, "previousPage"),
      viewsData,
      uniqueVisitors: uniqueVisitorsCount.length,
    });
  } catch (err) {
    console.error("Error in /api/chart route:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
