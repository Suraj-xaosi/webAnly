import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const siteId = searchParams.get("siteId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!siteId || !from || !to) {
      return NextResponse.json(
        { error: "siteId, from, and to are required" },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    // Get overall statistics
    const stats = await prisma.$queryRaw<
      {
        totalViews: number;
        totalVisitors: number;
        avgTimeSpent: number;
        bounceRate: number;
      }[]
    >`
      WITH visitor_stats AS (
        SELECT
          "visitorId",
          COUNT(*)::int AS page_views,
          AVG(COALESCE("TimeSpent", 0)) AS avg_time
        FROM "DailyStat"
        WHERE
          "siteId" = ${siteId}
          AND "date" >= ${fromDate}
          AND "date" <= ${toDate}
        GROUP BY "visitorId"
      )
      SELECT
        (SELECT COUNT(*)::int FROM "DailyStat" 
         WHERE "siteId" = ${siteId} 
         AND "date" >= ${fromDate} 
         AND "date" <= ${toDate}) AS "totalViews",
        COUNT(*)::int AS "totalVisitors",
        ROUND(AVG(avg_time))::int AS "avgTimeSpent",
        ROUND(
          (COUNT(*) FILTER (WHERE page_views = 1)::float / NULLIF(COUNT(*), 0)) * 100,
          2
        ) AS "bounceRate"
      FROM visitor_stats
    `;

    const result = stats[0] || {
      totalViews: 0,
      totalVisitors: 0,
      avgTimeSpent: 0,
      bounceRate: 0,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
