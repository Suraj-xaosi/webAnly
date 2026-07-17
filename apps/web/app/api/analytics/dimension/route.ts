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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidTimeZone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const domainId  = searchParams.get("domainId");
    const from      = searchParams.get("from");
    const to        = searchParams.get("to");
    const dimension = searchParams.get("dimension");
    const limit     = Math.min(Number(searchParams.get("limit") || 100), 500);
    // Viewer's IANA timezone. Defaults to UTC for callers not sending it yet.
    const timezone  = searchParams.get("timezone") || "UTC";

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

    if (!isValidTimeZone(timezone)) {
      return NextResponse.json(
        { error: "Invalid timezone. Use an IANA name like 'Asia/Kolkata'." },
        { status: 400 }
      );
    }

    if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const fromCheck = new Date(`${from}T00:00:00.000Z`);
    const toCheck = new Date(`${to}T00:00:00.000Z`);
    if (isNaN(fromCheck.getTime()) || isNaN(toCheck.getTime()) || fromCheck > toCheck) {
      return NextResponse.json(
        { error: "'from' must be before or equal to 'to'" },
        { status: 400 }
      );
    }

    // Same boundary fix as timeseries route: midnight of `from`/`to` computed
    // in the VIEWER'S timezone, not hardcoded UTC. This route doesn't bucket
    // by date (no date_trunc here), but which rows fall inside the requested
    // range still depends on this being correct.
    const lowerBoundSql = Prisma.sql`(${from}::date::timestamp AT TIME ZONE ${timezone})`;
    const upperBoundSql = Prisma.sql`((${to}::date + INTERVAL '1 day')::timestamp AT TIME ZONE ${timezone})`;

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
        AND "visitedAt"::timestamptz >= ${lowerBoundSql}
        AND "visitedAt"::timestamptz <  ${upperBoundSql}
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

    return NextResponse.json({ dimension, from, to, timezone, total: data.length, data });
  } catch (err) {
    console.error("[dimension] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
 