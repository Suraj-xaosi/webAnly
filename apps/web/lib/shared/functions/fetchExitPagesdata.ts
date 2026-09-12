import "server-only"
import { prisma } from "@repo/db"
import { getAnalyticsDateBounds, readCachedResponse, writeCachedResponse } from "./analyticsRouteUtils"
import type { ExitPagesResponse } from "@/lib/shared/types/analytics"

export async function fetchExitPagesData(
  domainId: string,
  from: string,
  to: string,
  timezone: string
): Promise<ExitPagesResponse> {
  const cacheKey = `exit-pages:${domainId}:${from}:${to}:${timezone}`

  const cachedResponse = await readCachedResponse<ExitPagesResponse>(cacheKey)
  if (cachedResponse) return await cachedResponse.json()

  const { lowerBoundSql, upperBoundSql } = getAnalyticsDateBounds(from, to, timezone)

  type Row = { name: string; views: number; exits: number }

  const rows = await prisma.$queryRaw<Row[]>`
    SELECT
      "page" AS name,
      COUNT(*)::int AS views,
      COUNT(*) FILTER (WHERE "exitType" = 'pagehide')::int AS exits
    FROM "PageVisit"
    WHERE "domainId" = ${domainId}
      AND "visitedAt"::timestamptz >= ${lowerBoundSql}
      AND "visitedAt"::timestamptz < ${upperBoundSql}
    GROUP BY 1
    ORDER BY exits DESC
  `

  const data = rows
    .filter((row) => row.exits > 0)
    .map((row) => ({
      name: row.name,
      views: row.views,
      exits: row.exits,
      exitRate: row.views > 0 ? +((row.exits / row.views) * 100).toFixed(1) : 0,
    }))

  const responseBody: ExitPagesResponse = { from, to, timezone, total: data.length, data }
  await writeCachedResponse(cacheKey, responseBody, to, timezone)
  return responseBody
}