import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const siteId = searchParams.get("siteId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = Number(searchParams.get("limit") || 20);

    if (!siteId || !from || !to) {
      return NextResponse.json(
        { error: "siteId, from, and to are required" },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const rows = await prisma.$queryRaw<
      {
        page: string;
        pageTitle: string | null;
        views: number;
        visitors: number;
        avgTimeSpent: number;
        exitCount: number;
      }[]
    >`
      SELECT
        page,
        MAX("pageTitle") AS "pageTitle",
        COUNT(*)::int AS views,
        COUNT(DISTINCT "visitorId")::int AS visitors,
        ROUND(AVG(COALESCE("TimeSpent", 0)))::int AS "avgTimeSpent",
        COUNT(*) FILTER (WHERE "eventType" = 'exit')::int AS "exitCount"
      FROM "DailyStat"
      WHERE
        "siteId" = ${siteId}
        AND "date" >= ${fromDate}
        AND "date" <= ${toDate}
      GROUP BY page
      ORDER BY views DESC
      LIMIT ${limit}
    `;

    const data = rows.map((row) => ({
      ...row,
      exitRate: row.views > 0 ? ((row.exitCount / row.views) * 100).toFixed(2) : "0.00",
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Top pages API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}