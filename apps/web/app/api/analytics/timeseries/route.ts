// app/api/analytics/timeseries/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

const INTERVAL_TRUNC_MAP: Record<string, string> = {
  hour:  "hour",
  day:   "day",
  week:  "week",
  month: "month",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const domainId = searchParams.get("domainId");
    const from     = searchParams.get("from");    // e.g. "2024-05-01"
    const to       = searchParams.get("to");      // e.g. "2024-05-07"
    const interval = searchParams.get("interval") || "hour";

    if (!domainId || !from || !to) {
      return NextResponse.json(
        { error: "domainId, from, and to are required" },
        { status: 400 }
      );
    }

    const trunc = INTERVAL_TRUNC_MAP[interval];
    if (!trunc) {
      return NextResponse.json(
        { error: `Invalid interval. Allowed: ${Object.keys(INTERVAL_TRUNC_MAP).join(", ")}` },
        { status: 400 }
      );
    }

    // Validate dates before using them
    const fromDate = new Date(`${from}T00:00:00.000Z`);

    let toDateExclusive: Date;
    if (to.toLowerCase() === "live") {
      toDateExclusive = new Date();
    } else {
      toDateExclusive = new Date(`${to}T00:00:00.000Z`);
      toDateExclusive.setUTCDate(toDateExclusive.getUTCDate() + 1); // exclusive upper bound
    }

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

    type Row = { bucket: Date; views: number; visitors: number };

    // PageVisit.visitedAt is the timestamp column (was "date" on the old DailyStat table).
    // PageVisit.domainId is camelCase already, matching the Prisma schema column name —
    // no quoting mismatch like the old "domainID" typo on DailyStat.
    const rows = await prisma.$queryRaw<Row[]>`
      SELECT
        date_trunc(${trunc}, "visitedAt"::timestamptz) AS bucket,
        COUNT(*)::int                                  AS views,
        COUNT(DISTINCT "visitorId")::int                AS visitors
      FROM "PageVisit"
      WHERE
        "domainId" = ${domainId}
        AND "visitedAt"::timestamptz >= ${fromDate}::timestamptz
        AND "visitedAt"::timestamptz <  ${toDateExclusive}::timestamptz
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    const data = rows.map((row) => ({
      date    : interval === "hour"
              ? row.bucket.toISOString()                  // "2024-05-01T14:00:00.000Z"
              : row.bucket.toISOString().split("T")[0],   // "2024-05-01"
      views   : row.views,
      visitors: row.visitors,
    }));

    return NextResponse.json({ interval, from, to, data });
  } catch (err) {
    console.error("[timeseries] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}