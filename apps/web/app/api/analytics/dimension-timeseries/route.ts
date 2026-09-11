import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@repo/db";
import {
  validateDateParams,
} from "@/lib/shared/functions/TimeFunctions";
import { DAY_NAMES, DIMENSION_COL_MAP, MONTH_NAMES, TRUNC_FOR, VALID_INTERVALS, type Interval } from "@/lib/shared/functions/analyticsConstants";
import { analyticsErrorResponse, getAnalyticsDateBounds, readCachedResponse, writeCachedResponse } from "@/lib/shared/functions/analyticsRouteUtils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const domainId = searchParams.get("domainId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const dimension = searchParams.get("dimension");
    const value = searchParams.get("value");
    let interval = (searchParams.get("interval") || "hour") as Interval;
    if (from === to) {
      interval = "hour";
    }
    const timezone = searchParams.get("timezone") || "UTC";

    if (!domainId || !dimension || !value) {
      return NextResponse.json(
        { error: "domainId, dimension and value are required" },
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

    if (!VALID_INTERVALS.includes(interval)) {
      return NextResponse.json(
        { error: `Invalid interval. Allowed: ${VALID_INTERVALS.join(", ")}` },
        { status: 400 }
      );
    }

    const validationError = validateDateParams(from, to, timezone);
    if (validationError) return validationError;

    const safeFrom = from as string;
    const safeTo = to as string;

    const cacheKey = `dimension-timeseries:${domainId}:${dimension}:${value}:${interval}:${safeFrom}:${safeTo}:${timezone}`;

    const cachedResponse = await readCachedResponse(cacheKey);
    if (cachedResponse) return cachedResponse;

    const { lowerBoundSql, upperBoundSql } = getAnalyticsDateBounds(safeFrom, safeTo, timezone);
    const colId = Prisma.raw(`"${col}"`);

    let data: { date: string; views: number; visitors: number }[];

    if (interval === "week") {
      type WeekRow = { week_num: number; views: number; visitors: number };

      const rows = await prisma.$queryRaw<WeekRow[]>`
        SELECT
          ((EXTRACT(DAY FROM ("visitedAt"::timestamptz AT TIME ZONE ${timezone}))::int - 1) / 7) + 1 AS week_num,
          COUNT(*)::int AS views,
          COUNT(DISTINCT "visitorId")::int AS visitors
        FROM "PageVisit"
        WHERE
          "domainId" = ${domainId}
          AND ${colId} = ${value}
          AND "visitedAt"::timestamptz >= ${lowerBoundSql}
          AND "visitedAt"::timestamptz < ${upperBoundSql}
        GROUP BY 1
        ORDER BY 1 ASC
      `;

      data = rows.map((row) => ({
        date: `week${row.week_num}`,
        views: row.views,
        visitors: row.visitors,
      }));
    } else {
      type Row = { bucket: Date; views: number; visitors: number };
      const trunc = TRUNC_FOR[interval];

      const rows = await prisma.$queryRaw<Row[]>`
        SELECT
          date_trunc(${trunc}, "visitedAt"::timestamptz AT TIME ZONE ${timezone}) AS bucket,
          COUNT(*)::int AS views,
          COUNT(DISTINCT "visitorId")::int AS visitors
        FROM "PageVisit"
        WHERE
          "domainId" = ${domainId}
          AND ${colId} = ${value}
          AND "visitedAt"::timestamptz >= ${lowerBoundSql}
          AND "visitedAt"::timestamptz < ${upperBoundSql}
        GROUP BY 1
        ORDER BY 1 ASC
      `;

      data = rows.map((row) => {
        let date: string;
        switch (interval) {
          case "hour": {
            const hours = row.bucket.getUTCHours();
            const period = hours >= 12 ? "pm" : "am";
            const hour12 = hours % 12 === 0 ? 12 : hours % 12;
            date = `${hour12}${period}`;
            break;
          }
          case "dayname":
            date = DAY_NAMES[row.bucket.getUTCDay()]!;
            break;
          case "day": {
            date = row.bucket.toISOString().split("T")[0] ?? "";
            break;
          }
          case "month":
            date = `${MONTH_NAMES[row.bucket.getUTCMonth()]}-${row.bucket.getUTCFullYear()}`;
            break;
          default:
            date = row.bucket.toISOString();
        }
        return { date, views: row.views, visitors: row.visitors };
      });
    }

    const responseBody = { dimension, value, interval, from: safeFrom, to: safeTo, timezone, data };

    await writeCachedResponse(cacheKey, responseBody, safeTo, timezone);

    return NextResponse.json(responseBody);
  } catch (err) {
    return analyticsErrorResponse("dimension-timeseries", err);
  }
}