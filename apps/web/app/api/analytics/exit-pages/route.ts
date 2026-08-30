
import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@repo/db";
import { getCache, setCache } from "@repo/redis";
import {
  CACHE_TTL_TODAY,
  CACHE_TTL_PAST,
  todayInTimeZone,
  validateDateParams,
} from "@/lib/shared/functions/TimeFunctions";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const domainId = searchParams.get("domainId");
    const from     = searchParams.get("from");
    const to       = searchParams.get("to");
    //const limit    = Math.min(Number(searchParams.get("limit") || 100), 500);

    
    const timezone = searchParams.get("timezone") || "UTC";

    if (!domainId) {
      return NextResponse.json(
        { error: "domainId is required" },
        { status: 400 }
      );
    }

    const validationError = validateDateParams(from, to, timezone);
    if (validationError) return validationError;

    const safeFrom = from as string;
    const safeTo = to as string;

;
    const cacheKey = `exit-pages:${domainId}:${safeFrom}:${safeTo}:${timezone}`;

    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const lowerBoundSql = Prisma.sql`(${safeFrom}::date::timestamp AT TIME ZONE ${timezone})`;
    const upperBoundSql = Prisma.sql`((${safeTo}::date + INTERVAL '1 day')::timestamp AT TIME ZONE ${timezone})`;

    type Row = { name: string; views: number; exits: number };


    const rows = await prisma.$queryRaw<Row[]>`
      SELECT
        "page"                                                    AS name,
        COUNT(*)::int                                              AS views,
        COUNT(*) FILTER (WHERE "exitType" = 'pagehide')::int       AS exits
      FROM "PageVisit"
      WHERE
        "domainId" = ${domainId}
        AND "visitedAt"::timestamptz >= ${lowerBoundSql}
        AND "visitedAt"::timestamptz <  ${upperBoundSql}
      GROUP BY 1
      ORDER BY exits DESC
      
    `;

    const data = rows
      .filter((row) => row.exits > 0)
      .map((row) => ({
        name:     row.name,
        exits:    row.exits,
        exitRate: row.views > 0 ? +((row.exits / row.views) * 100).toFixed(1) : 0,
      }));

    const responseBody = { from: safeFrom, to: safeTo, timezone, total: data.length, data };

    const isToToday = safeTo === todayInTimeZone(timezone);
    const ttl = isToToday ? CACHE_TTL_TODAY : CACHE_TTL_PAST;

    await setCache(cacheKey, responseBody, ttl);

    return NextResponse.json(responseBody);
  } catch (err) {
    console.error("[exit-pages] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}