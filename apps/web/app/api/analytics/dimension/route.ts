import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@repo/db";
import { getCache, setCache } from "@repo/redis";
import {
  CACHE_TTL_TODAY,
  CACHE_TTL_PAST,
  todayInTimeZone,
  validateDateParams,
} from "@/lib/shared/functions/TimeFunctions";

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
    const timezone  = searchParams.get("timezone") || "UTC";

    if (!domainId || !dimension) {
      return NextResponse.json(
        { error: "domainId and dimension are required" },
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

    const validationError = validateDateParams(from, to, timezone);
    if (validationError) return validationError;

    // TypeScript ko yakeen dilane ke liye ki from/to yahan se aage null nahi hain
    // (validateDateParams already check kar chuka hai, lekin TS ko pata nahi)
    const safeFrom = from as string;
    const safeTo = to as string;

    const cacheKey = `dimension:${domainId}:${dimension}:${safeFrom}:${safeTo}:${timezone}:${limit}`;

    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const lowerBoundSql = Prisma.sql`(${safeFrom}::date::timestamp AT TIME ZONE ${timezone})`;
    const upperBoundSql = Prisma.sql`((${safeTo}::date + INTERVAL '1 day')::timestamp AT TIME ZONE ${timezone})`;

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

    const responseBody = { dimension, from: safeFrom, to: safeTo, timezone, total: data.length, data };

    const isToToday = safeTo === todayInTimeZone(timezone);
    const ttl = isToToday ? CACHE_TTL_TODAY : CACHE_TTL_PAST;

    await setCache(cacheKey, responseBody, ttl);

    return NextResponse.json(responseBody);
  } catch (err) {
    console.error("[dimension] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}