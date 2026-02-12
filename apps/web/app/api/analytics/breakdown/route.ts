import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { Prisma } from "@prisma/client";

const DIMENSION_COLUMN_MAP: Record<string, string> = {
  page: "page",
  browser: "browser",
  device: "device",
  country: "country",
  os: "os",
  referrer: "previousPage",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const siteId = searchParams.get("siteId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const dimension = searchParams.get("dimension");
    const limit = Number(searchParams.get("limit") || 100);

    if (!siteId || !from || !to || !dimension) {
      return NextResponse.json(
        { error: "siteId, from, to and dimension are required" },
        { status: 400 }
      );
    }

    const column = DIMENSION_COLUMN_MAP[dimension];
    if (!column) {
      return NextResponse.json(
        { error: "Invalid dimension" },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    
    const rows = await prisma.$queryRaw<
      {
        name: string | null;
        views: number;
        visitors: number;
        avgTimeSpent: number | null;
      }[]
    >`
      SELECT
        ${//@ts-ignore
          Prisma.raw(`"${column}"`)
        } AS name,
        COUNT(*)::int AS views,
        COUNT(DISTINCT "visitorId")::int AS visitors,
        ROUND(AVG(COALESCE("TimeSpent", 0)))::int AS "avgTimeSpent"
      FROM "DailyStat"
      WHERE
        "siteId" = ${siteId}
        AND "date" >= ${fromDate}
        AND "date" <= ${toDate}
        AND ${Prisma.raw(`"${column}"`)} IS NOT NULL
        AND "eventType" = 'pageview'
      GROUP BY 1
      ORDER BY views DESC
      LIMIT ${limit}
    `;
        //@ts-ignore
    const data = rows.map((row) => ({
      name: row.name || "Unknown",
      views: row.views,
      visitors: row.visitors,
      avgTimeSpent: row.avgTimeSpent || 0,
      viewsPerVisitor: (row.views / row.visitors).toFixed(2),
    }));

    return NextResponse.json({
      dimension,
      data,
      total: data.length,
    });
  } catch (error) {
    console.error("Breakdown API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}