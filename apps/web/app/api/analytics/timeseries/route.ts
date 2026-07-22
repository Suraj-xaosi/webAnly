// app/api/analytics/timeseries/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@repo/db";
import { getCache, setCache } from "@repo/redis";

const VALID_INTERVALS = ["hour", "dayname", "day", "week", "month"] as const;
type Interval = (typeof VALID_INTERVALS)[number];

const TRUNC_FOR: Record<Exclude<Interval, "week">, string> = {
  hour:    "hour",
  dayname: "day",
  day:     "day",
  month:   "month",
};

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];
const DAY_NAMES = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
];

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
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const domainId = searchParams.get("domainId");
    const from     = searchParams.get("from");    // e.g. "2024-05-01"
    const to       = searchParams.get("to");      // e.g. "2024-05-07" or "live"
    let interval = (searchParams.get("interval") || "hour") as Interval;
    if (from === to) {
      interval = "hour";
    }
    // Viewer's IANA timezone, e.g. "Asia/Kolkata". Defaults to UTC so existing

    const timezone = searchParams.get("timezone") || "UTC";

    if (!domainId || !from || !to) {
      return NextResponse.json(
        { error: "domainId, from, and to are required" },
        { status: 400 }
      );
    }

    if (!VALID_INTERVALS.includes(interval)) {
      return NextResponse.json(
        { error: `Invalid interval. Allowed: ${VALID_INTERVALS.join(", ")}` },
        { status: 400 }
      );
    }

    if (!isValidTimeZone(timezone)) {
      return NextResponse.json(
        { error: "Invalid timezone. Use an IANA name like 'Asia/Kolkata'." },
        { status: 400 }
      );
    }

    // Cache key uses the *effective* interval (post from===to override), since
    // that's what actually determines the query and the shape of `data`.
    const cacheKey = `timeseries:${domainId}:${interval}:${from}:${to}:${timezone}`;

    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const lowerBoundSql = Prisma.sql`(${from}::date::timestamp AT TIME ZONE ${timezone})`;

    const upperBoundSql =  Prisma.sql`((${to}::date + INTERVAL '1 day')::timestamp AT TIME ZONE ${timezone})`;

    let data: { date: string; views: number; visitors: number }[];

    if (interval === "week") {

      type WeekRow = { week_num: number; views: number; visitors: number };

      const rows = await prisma.$queryRaw<WeekRow[]>`
        SELECT
          ((EXTRACT(DAY FROM ("visitedAt"::timestamptz AT TIME ZONE ${timezone}))::int - 1) / 7) + 1 AS week_num,
          COUNT(*)::int                                                   AS views,
          COUNT(DISTINCT "visitorId")::int                                AS visitors
        FROM "PageVisit"
        WHERE
          "domainId" = ${domainId}
          AND "visitedAt"::timestamptz >= ${lowerBoundSql}
          AND "visitedAt"::timestamptz <  ${upperBoundSql}
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
          COUNT(*)::int                                  AS views,
          COUNT(DISTINCT "visitorId")::int                AS visitors
        FROM "PageVisit"
        WHERE
          "domainId" = ${domainId}
          AND "visitedAt"::timestamptz >= ${lowerBoundSql}
          AND "visitedAt"::timestamptz <  ${upperBoundSql}
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
            const isoDate = row.bucket.toISOString().split("T")[0] ?? "";
            date = isoDate;
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

    const responseBody = { interval, from, to, timezone, data };

    // Same "to is today" freshness rule as the dimension route: today's bucket
    // is still accumulating events, so keep the TTL short; past ranges are
    // immutable history and can be cached much longer.
    const isToToday = to === todayInTimeZone(timezone);
    const ttl = isToToday ? CACHE_TTL_TODAY : CACHE_TTL_PAST;

    await setCache(cacheKey, responseBody, ttl);

    return NextResponse.json(responseBody);
  } catch (err) {
    console.error("[timeseries] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}