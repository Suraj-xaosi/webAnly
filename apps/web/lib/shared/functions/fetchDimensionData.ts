import "server-only"
import { prisma, Prisma } from "@repo/db"
import { DIMENSION_COL_MAP } from "./analyticsConstants"
import { getAnalyticsDateBounds, readCachedResponse, writeCachedResponse } from "./analyticsRouteUtils"
import type { Dimension, DimensionResponse } from "@/lib/shared/types/analytics"

export async function fetchDimensionData(
  domainId: string,
  dimension: Dimension,
  from: string,
  to: string,
  timezone: string
): Promise<DimensionResponse> {
  const cacheKey = `dimension:${domainId}:${dimension}:${from}:${to}:${timezone}`

  const cachedResponse = await readCachedResponse<DimensionResponse>(cacheKey)
  if (cachedResponse) return await cachedResponse.json()

  const col = DIMENSION_COL_MAP[dimension]
  const colId = Prisma.raw(`"${col}"`)
  const { lowerBoundSql, upperBoundSql } = getAnalyticsDateBounds(from, to, timezone)

  type Row = { name: string | null; views: number; visitors: number; avgDwell: number | null }

  const rows = await prisma.$queryRaw<Row[]>`
    SELECT
      ${colId} AS name,
      COUNT(*)::int AS views,
      COUNT(DISTINCT "visitorId")::int AS visitors,
      ROUND(AVG(COALESCE("timeSpent", 0)))::int AS "avgDwell"
    FROM "PageVisit"
    WHERE
      "domainId" = ${domainId}
      AND "visitedAt"::timestamptz >= ${lowerBoundSql}
      AND "visitedAt"::timestamptz < ${upperBoundSql}
      AND ${colId} IS NOT NULL
    GROUP BY 1
    ORDER BY views DESC
  `

  const data = rows.map((row) => ({
    name: row.name ?? "Unknown",
    views: row.views,
    visitors: row.visitors,
    avgDwell: row.avgDwell ?? 0,
    viewsPerVisitor: row.visitors > 0 ? +(row.views / row.visitors).toFixed(2) : 0,
  }))

  const responseBody: DimensionResponse = { dimension, from, to, timezone, total: data.length, data }
  await writeCachedResponse(cacheKey, responseBody, to, timezone)
  return responseBody
}