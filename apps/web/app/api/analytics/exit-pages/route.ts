
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import {
  validateDateParams,
} from "@/lib/shared/functions/TimeFunctions";
import { analyticsErrorResponse, getAnalyticsDateBounds, readCachedResponse, writeCachedResponse } from "@/lib/shared/functions/analyticsRouteUtils";

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

    const cachedResponse = await readCachedResponse(cacheKey);
    if (cachedResponse) return cachedResponse;

    const { lowerBoundSql, upperBoundSql } = getAnalyticsDateBounds(safeFrom, safeTo, timezone);

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

    await writeCachedResponse(cacheKey, responseBody, safeTo, timezone);

    return NextResponse.json(responseBody);
  } catch (err) {
    return analyticsErrorResponse("exit-pages", err);
  }
}