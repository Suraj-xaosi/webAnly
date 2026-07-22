// app/api/analytics/dimension/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@repo/db";
import { getCache, setCache } from "@repo/redis";

const DIMENSION_COL_MAP: Record<string, string> = {
  page:     "page",
  browser:  "browser",
  device:   "device",
  country:  "country",
  os:       "os",
  referrer: "referrer",
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const CACHE_TTL_TODAY = 30;        // seconds
const CACHE_TTL_PAST  = 600;       // 10 minutes

function isValidTimeZone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// Returns "YYYY-MM-DD" for "now" as seen in the given IANA timezone.
function todayInTimeZone(timezone: string): string {
  // en-CA locale formats as YYYY-MM-DD, which matches DATE_RE directly
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const domainId  = searchParams.get("domainId");
    const from      = searchParams.get("from");
    const to        = searchParams.get("to");
    const dimension = searchParams.get("dimension");
    const limit     = Math.min(Number(searchParams.get("limit") || 100), 500);
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

    // Cache key includes every param that changes the query result.
    const cacheKey = `dimension:${domainId}:${dimension}:${from}:${to}:${timezone}:${limit}`;

    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const lowerBoundSql = Prisma.sql`(${from}::date::timestamp AT TIME ZONE ${timezone})`;
    const upperBoundSql = Prisma.sql`((${to}::date + INTERVAL '1 day')::timestamp AT TIME ZONE ${timezone})`;

    type Row = { name: string | null; views: number; visitors: number; avgDwell: number | null };

    const colId = Prisma.raw(`"${col}"`);

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
      avgDwell:        row.avgDwell ?? 0,
      viewsPerVisitor: row.visitors > 0 ? +(row.views / row.visitors).toFixed(2) : 0,
    }));

    const responseBody = { dimension, from, to, timezone, total: data.length, data };

    // "to" being today (in the viewer's own timezone) means the day is still
    // accumulating events — short TTL. A past "to" date is immutable history,
    // so it's safe to cache much longer.
    const isToToday = to === todayInTimeZone(timezone);
    const ttl = isToToday ? CACHE_TTL_TODAY : CACHE_TTL_PAST;

    await setCache(cacheKey, responseBody, ttl);

    return NextResponse.json(responseBody);
  } catch (err) {
    console.error("[dimension] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}