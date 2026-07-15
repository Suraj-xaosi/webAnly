// app/api/analytics/timeseries/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

const VALID_INTERVALS = ["hour", "dayname", "day", "week", "month"] as const;
type Interval = (typeof VALID_INTERVALS)[number];

// Grouping used for the non-week intervals (week is handled by its own query below)
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const domainId = searchParams.get("domainId");
    const from     = searchParams.get("from");    // e.g. "2024-05-01"
    const to       = searchParams.get("to");      // e.g. "2024-05-07"
    const interval = (searchParams.get("interval") || "hour") as Interval;

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

    let data: { date: string; views: number; visitors: number }[];

    if (interval === "week") {
      // "This Month" only. Groups directly in SQL by week-of-month (1-indexed),
      // so COUNT(DISTINCT "visitorId") is correct per week — summing pre-aggregated
      // daily distinct-visitor counts would double-count returning visitors.
      type WeekRow = { week_num: number; views: number; visitors: number };

      const rows = await prisma.$queryRaw<WeekRow[]>`
        SELECT
          ((EXTRACT(DAY FROM "visitedAt"::timestamptz)::int - 1) / 7) + 1 AS week_num,
          COUNT(*)::int                                                   AS views,
          COUNT(DISTINCT "visitorId")::int                                AS visitors
        FROM "PageVisit"
        WHERE
          "domainId" = ${domainId}
          AND "visitedAt"::timestamptz >= ${fromDate}::timestamptz
          AND "visitedAt"::timestamptz <  ${toDateExclusive}::timestamptz
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

      data = rows.map((row) => {
        let date: string;
        switch (interval) {
          case "hour": {
            const isoDate = row.bucket.toISOString().split("T")[0] ?? "";
            const hours = row.bucket.getUTCHours();
            const period = hours >= 12 ? "pm" : "am";
            const hour12 = hours % 12 === 0 ? 12 : hours % 12;
            date = `${isoDate}-${hour12}${period}`;
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

    return NextResponse.json({ interval, from, to, data });
  } catch (err) {
    console.error("[timeseries] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}