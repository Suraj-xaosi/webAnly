// app/api/analytics/exit-pages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@repo/db";
import { getCache, setCache } from "@repo/redis";

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
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const domainId = searchParams.get("domainId");
    const from     = searchParams.get("from");
    const to       = searchParams.get("to");
    const limit    = Math.min(Number(searchParams.get("limit") || 100), 500);
    // Viewer's IANA timezone. Defaults to UTC for callers not sending it yet.
    const timezone = searchParams.get("timezone") || "UTC";

    if (!domainId || !from || !to) {
      return NextResponse.json(
        { error: "domainId, from, and to are required" },
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

    // Cache key includes every param that changes the query result, including
    // `limit` — it's part of the SQL LIMIT clause, so two different limits
    // must never share a cache entry.
    const cacheKey = `exit-pages:${domainId}:${from}:${to}:${timezone}:${limit}`;

    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Same boundary fix as the other two routes — midnight of `from`/`to`
    // computed in the viewer's timezone, not hardcoded UTC.
    const lowerBoundSql = Prisma.sql`(${from}::date::timestamp AT TIME ZONE ${timezone})`;
    const upperBoundSql = Prisma.sql`((${to}::date + INTERVAL '1 day')::timestamp AT TIME ZONE ${timezone})`;

    type Row = { name: string; views: number; exits: number };

    // views = total pageviews for that page in range, regardless of exitType.
    // exits = subset of those views where exitType = 'pagehide' (a confirmed
    // real exit — tab/browser closed, or navigated away from the site entirely).
    // "navigation" (SPA route change on the same site) and "hidden" (ambiguous,
    // could return) are intentionally excluded from the exits count.
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
      LIMIT ${limit}
    `;

    const data = rows
      .filter((row) => row.exits > 0)
      .map((row) => ({
        name:     row.name,
        exits:    row.exits,
        exitRate: row.views > 0 ? +((row.exits / row.views) * 100).toFixed(1) : 0,
      }));

    const responseBody = { from, to, timezone, total: data.length, data };

    const isToToday = to === todayInTimeZone(timezone);
    const ttl = isToToday ? CACHE_TTL_TODAY : CACHE_TTL_PAST;

    await setCache(cacheKey, responseBody, ttl);

    return NextResponse.json(responseBody);
  } catch (err) {
    console.error("[exit-pages] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}