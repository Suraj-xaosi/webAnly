import "server-only"
import { prisma } from "@repo/db"
import { getAnalyticsDateBounds, readCachedResponse, writeCachedResponse } from "./analyticsRouteUtils"
import type { FlowEntry, FlowResponse } from "@/lib/shared/types/analytics"

export async function fetchFlowData(
  domainId: string,
  page: string,
  from: string,
  to: string,
  timezone: string
): Promise<FlowResponse> {
  const cacheKey = `flow:${domainId}:${page}:${from}:${to}:${timezone}`

  const cachedResponse = await readCachedResponse<FlowResponse>(cacheKey)
  if (cachedResponse) return await cachedResponse.json()

  const { lowerBoundSql, upperBoundSql } = getAnalyticsDateBounds(from, to, timezone)

  type Row = {
    name: string | null
    views: number
    visitors: number
  }

  const incomingRows = await prisma.$queryRaw<Row[]>`
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
    ORDER BY views DESC, visitors DESC
    LIMIT 10
  `

  const outgoingRows = await prisma.$queryRaw<Row[]>`
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
    ORDER BY views DESC, visitors DESC
    LIMIT 10
  `

  const exitRows = await prisma.$queryRaw<Row[]>`
    SELECT
      "page" AS name,
      COUNT(*)::int AS views,
      COUNT(DISTINCT "visitorId")::int AS visitors
    FROM "page_visit"
    WHERE "domainId" = ${domainId}
      AND "page" = ${page}
      AND "exitType" = 'pagehide'
      AND "visitedAt"::timestamptz >= ${lowerBoundSql}
      AND "visitedAt"::timestamptz < ${upperBoundSql}
    GROUP BY 1
  `

  function foldRows(rows: Row[], type: "page" | "source", otherName: string): FlowEntry[] {
    const entries: FlowEntry[] = rows.map((row) => ({
      name: row.name ?? "Direct / None",
      type: row.name ? type : "source",
      views: row.views,
      visitors: row.visitors,
    }))
    const kept = entries.slice(0, 9)
    const rest = entries.slice(9)
    if (rest.length > 0) {
      kept.push({
        name: otherName,
        type: "other",
        views: rest.reduce((sum, row) => sum + row.views, 0),
        visitors: rest.reduce((sum, row) => sum + row.visitors, 0),
      })
    }
    return kept
  }

  const incoming = foldRows(incomingRows, "page", "Other incoming pages")
  const outgoing = foldRows(outgoingRows, "page", "Other outgoing pages")
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
