import "server-only"
import { prisma } from "@repo/db"
import { getAnalyticsDateBounds, readCachedResponse, writeCachedResponse } from "./helper/analyticsRouteUtils"
import type { FlowEntry, FlowResponse } from "@/lib/shared/types/analytics"

export async function fetchFlowData(
  domainId: string,
  page: string,
  from: string,
  to: string,
  timezone: string
): Promise<FlowResponse> {
  const cacheKey = `flow:${domainId}:${page}:${from}:${to}:${timezone}:v2`

  const cachedResponse = await readCachedResponse<FlowResponse>(cacheKey)
  if (cachedResponse) return await cachedResponse.json()

  const { lowerBoundSql, upperBoundSql } = getAnalyticsDateBounds(from, to, timezone)

  type Row = {
    name: string | null
    views: number
    visitors: number
  }

  type ExitRow = {
    views: number
    visitors: number
  }

  const [incomingRows, outgoingRows, exitRows] = await Promise.all([
    prisma.$queryRaw<Row[]>`
    WITH grouped AS (
      SELECT
        NULLIF("previousPage", '') AS name,
        COUNT(*)::int AS views,
        COUNT(DISTINCT "visitorId")::int AS visitors
      FROM "page_visit"
      WHERE "domainId" = ${domainId}
        AND "page" = ${page}
        AND "visitedAt"::timestamptz >= ${lowerBoundSql}
        AND "visitedAt"::timestamptz < ${upperBoundSql}
      GROUP BY 1
    ), ranked AS (
      SELECT
        name,
        views,
        visitors,
        ROW_NUMBER() OVER (
          ORDER BY views DESC, visitors DESC, name ASC NULLS FIRST
        ) AS position
      FROM grouped
    )
    SELECT name, views, visitors
    FROM ranked
    WHERE position <= 9
    UNION ALL
    SELECT
      'Other incoming pages' AS name,
      SUM(views)::int AS views,
      SUM(visitors)::int AS visitors
    FROM ranked
    WHERE position > 9
    HAVING COUNT(*) > 0
    ORDER BY views DESC, visitors DESC, name ASC
    `,

    prisma.$queryRaw<Row[]>`
    WITH grouped AS (
      SELECT
        "page" AS name,
        COUNT(*)::int AS views,
        COUNT(DISTINCT "visitorId")::int AS visitors
      FROM "page_visit"
      WHERE "domainId" = ${domainId}
        AND "previousPage" = ${page}
        AND "visitedAt"::timestamptz >= ${lowerBoundSql}
        AND "visitedAt"::timestamptz < ${upperBoundSql}
      GROUP BY 1
    ), ranked AS (
      SELECT
        name,
        views,
        visitors,
        ROW_NUMBER() OVER (
          ORDER BY views DESC, visitors DESC, name ASC
        ) AS position
      FROM grouped
    )
    SELECT name, views, visitors
    FROM ranked
    WHERE position <= 9
    UNION ALL
    SELECT
      'Other outgoing pages' AS name,
      SUM(views)::int AS views,
      SUM(visitors)::int AS visitors
    FROM ranked
    WHERE position > 9
    HAVING COUNT(*) > 0
    ORDER BY views DESC, visitors DESC, name ASC
    `,

    prisma.$queryRaw<ExitRow[]>`
    SELECT
      COUNT(*)::int AS views,
      COUNT(DISTINCT "visitorId")::int AS visitors
    FROM "page_visit"
    WHERE "domainId" = ${domainId}
      AND "page" = ${page}
      AND "exitType" = 'pagehide'
      AND "visitedAt"::timestamptz >= ${lowerBoundSql}
      AND "visitedAt"::timestamptz < ${upperBoundSql}
    `,
  ])

  function toFlowEntries(rows: Row[], type: "page" | "source"): FlowEntry[] {
    return rows.map((row) => ({
      name: row.name ?? "Direct / None",
      type: row.name ? type : "source",
      views: row.views,
      visitors: row.visitors,
    }))
  }

  const incoming = toFlowEntries(incomingRows, "page")
  const outgoing = toFlowEntries(outgoingRows, "page")
  const exits = exitRows[0]

  if (exits && exits.views > 0) {
    outgoing.push({
      name: "Exit",
      type: "exit",
      views: exits.views,
      visitors: exits.visitors,
    })
  }

  const responseBody: FlowResponse = {
    page,
    from,
    to,
    timezone,
    incoming,
    outgoing,
  }

  await writeCachedResponse(cacheKey, responseBody, to, timezone)
  return responseBody
}
