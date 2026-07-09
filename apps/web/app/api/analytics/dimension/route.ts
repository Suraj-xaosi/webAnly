// app/api/analytics/dimension/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@repo/db";

const DIMENSION_COL_MAP: Record<string, string> = {
  page:     "page",
  browser:  "browser",
  device:   "device",
  country:  "country",
  os:       "os",
  referrer: "referrer",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const domainId  = searchParams.get("domainId");
    const from      = searchParams.get("from");
    const to        = searchParams.get("to");
    const dimension = searchParams.get("dimension");
    const limit     = Math.min(Number(searchParams.get("limit") || 100), 500);

    if (!domainId || !from || !to || !dimension) {
      return NextResponse.json(
        { error: "domainId, from, to, and dimension are required" },
        { status: 400 }
      );
    }

    const col = DIMENSION_COL_MAP[dimension];
    if (!col) {
      return NextResponse.json(
        { error: `Invalid dimension. Allowed: ${Object.keys(DIMENSION_COL_MAP).join(", ")}` },
        { status: 400 }
      );
    }

    // Validate dates before using them
    const fromDate = new Date(`${from}T00:00:00.000Z`);
    const toDateExclusive = new Date(`${to}T00:00:00.000Z`);
    toDateExclusive.setUTCDate(toDateExclusive.getUTCDate() + 1); // exclusive upper bound

    if (isNaN(fromDate.getTime()) || isNaN(toDateExclusive.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    if (fromDate >= toDateExclusive) {
      return NextResponse.json(
        { error: "'from' must be before 'to'" },
        { status: 400 }
      );
    }

    type Row = { name: string | null; views: number; visitors: number; avgDwell: number | null };

    const colId = Prisma.raw(`"${col}"`);

    // PageVisit has no "eventType" column (that was specific to the old DailyStat table) —
    // every row here is already one pageview, so the old "!= 'exit'" filter is dropped.
    // timeSpent is non-nullable on PageVisit, but COALESCE kept as a safety net.
    const rows = await prisma.$queryRaw<Row[]>`
      SELECT
        ${colId}                                       AS name,
        COUNT(*)::int                                  AS views,
        COUNT(DISTINCT "visitorId")::int                AS visitors,
        ROUND(AVG(COALESCE("timeSpent", 0)))::int       AS "avgDwell"
      FROM "PageVisit"
      WHERE
        "domainId" = ${domainId}
        AND "visitedAt" >= ${fromDate}
        AND "visitedAt" <  ${toDateExclusive}
        AND ${colId} IS NOT NULL
      GROUP BY 1
      ORDER BY views DESC
      LIMIT ${limit}
    `;

    const data = rows.map((row) => ({
      name:            row.name ?? "Unknown",
      views:           row.views,
      visitors:        row.visitors,
      avgDwell:        row.avgDwell ?? 0,          // seconds
      viewsPerVisitor: row.visitors > 0 ? +(row.views / row.visitors).toFixed(2) : 0,
    }));

    return NextResponse.json({ dimension, from, to, total: data.length, data });
  } catch (err) {
    console.error("[dimension] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}