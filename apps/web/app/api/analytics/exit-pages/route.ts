/*// app/api/analytics/exit-pages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const domainId = searchParams.get("domainId");
    const from     = searchParams.get("from");
    const to       = searchParams.get("to");
    const limit    = Math.min(Number(searchParams.get("limit") || 100), 500);

    if (!domainId || !from || !to) {
      return NextResponse.json(
        { error: "domainId, from, and to are required" },
        { status: 400 }
      );
    }

    const fromDate = new Date(`${from}T00:00:00.000Z`);
    const toDateExclusive = new Date(`${to}T00:00:00.000Z`);
    toDateExclusive.setUTCDate(toDateExclusive.getUTCDate() + 1); // exclusive upper bound

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
        AND "visitedAt" >= ${fromDate}
        AND "visitedAt" <  ${toDateExclusive}
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

    return NextResponse.json({ from, to, total: data.length, data });
  } catch (err) {
    console.error("[exit-pages] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
*/


// app/api/analytics/exit-pages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@repo/db";

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

    return NextResponse.json({ from, to, timezone, total: data.length, data });
  } catch (err) {
    console.error("[exit-pages] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 
