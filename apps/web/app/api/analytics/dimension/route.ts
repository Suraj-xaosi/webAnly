import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@repo/db";
import {
  validateDateParams,
} from "@/lib/shared/functions/TimeFunctions";
import { DIMENSION_COL_MAP } from "@/lib/shared/functions/analyticsConstants";
import { analyticsErrorResponse, getAnalyticsDateBounds, readCachedResponse, writeCachedResponse } from "@/lib/shared/functions/analyticsRouteUtils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const domainId  = searchParams.get("domainId");
    const from      = searchParams.get("from");
    const to        = searchParams.get("to");
    const dimension = searchParams.get("dimension");
    //const limit     = Math.min(Number(searchParams.get("limit") || 100), 500);
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

    
    const safeFrom = from as string;
    const safeTo = to as string;

    //const cacheKey = `dimension:${domainId}:${dimension}:${safeFrom}:${safeTo}:${timezone}:${limit}`;
    const cacheKey = `dimension:${domainId}:${dimension}:${safeFrom}:${safeTo}:${timezone}`;

    const cachedResponse = await readCachedResponse(cacheKey);
    if (cachedResponse) return cachedResponse;

    const { lowerBoundSql, upperBoundSql } = getAnalyticsDateBounds(safeFrom, safeTo, timezone);

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
      
    `;

    const data = rows.map((row) => ({
      name:            row.name ?? "Unknown",
      views:           row.views,
      visitors:        row.visitors,
      avgDwell:        row.avgDwell ?? 0,
      viewsPerVisitor: row.visitors > 0 ? +(row.views / row.visitors).toFixed(2) : 0,
    }));

    const responseBody = { dimension, from: safeFrom, to: safeTo, timezone, total: data.length, data };

    await writeCachedResponse(cacheKey, responseBody, safeTo, timezone);

    return NextResponse.json(responseBody);
  } catch (err) {
    return analyticsErrorResponse("dimension", err);
  }
}