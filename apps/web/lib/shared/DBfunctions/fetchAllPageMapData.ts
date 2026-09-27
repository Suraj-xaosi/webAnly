import "server-only"
import { prisma } from "@repo/db"
import {
  getAnalyticsDateBounds,
  readCachedResponse,
  writeCachedResponse,
} from "./helper/analyticsRouteUtils"
import type {
  PageMapEdge,
  PageMapNode,
  PageMapResponse,
} from "@/lib/shared/types/analytics"

const MAX_PAGE_MAP_NODES = 15
const MAX_PAGE_MAP_EDGES = 40

type GraphRow = {
  nodes: PageMapNode[]
  edges: PageMapEdge[]
}

export async function fetchAllPageMapData(
  domainId: string,
  from: string,
  to: string,
  timezone: string
): Promise<PageMapResponse> {
  const cacheKey = `all-page-map:${domainId}:${from}:${to}:${timezone}:v1`

  const cachedResponse = await readCachedResponse<PageMapResponse>(cacheKey)
  if (cachedResponse) return await cachedResponse.json()

  const { lowerBoundSql, upperBoundSql } = getAnalyticsDateBounds(
    from,
    to,
    timezone
  )

  const [row] = await prisma.$queryRaw<GraphRow[]>`
    WITH selected_pages AS (
      SELECT
        "page" AS id,
        COUNT(*)::int AS views,
        COUNT(DISTINCT "visitorId")::int AS visitors,
        COUNT(*) FILTER (WHERE "exitType" = 'pagehide')::int AS exits
      FROM "page_visit"
      WHERE "domainId" = ${domainId}
        AND "visitedAt"::timestamptz >= ${lowerBoundSql}
        AND "visitedAt"::timestamptz < ${upperBoundSql}
        AND "page" <> ''
      GROUP BY "page"
      ORDER BY views DESC, visitors DESC, id ASC
      LIMIT ${MAX_PAGE_MAP_NODES}
    ), ranked_edges AS (
      SELECT
        visits."previousPage" AS source,
        visits."page" AS target,
        COUNT(*)::int AS views,
        COUNT(DISTINCT visits."visitorId")::int AS visitors
      FROM "page_visit" AS visits
      INNER JOIN selected_pages AS source_page
        ON source_page.id = visits."previousPage"
      INNER JOIN selected_pages AS target_page
        ON target_page.id = visits."page"
      WHERE visits."domainId" = ${domainId}
        AND visits."previousPage" IS NOT NULL
        AND visits."previousPage" <> ''
        AND visits."visitedAt"::timestamptz >= ${lowerBoundSql}
        AND visits."visitedAt"::timestamptz < ${upperBoundSql}
      GROUP BY visits."previousPage", visits."page"
      ORDER BY views DESC, visitors DESC, source ASC, target ASC
      LIMIT ${MAX_PAGE_MAP_EDGES}
    )
    SELECT
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', id,
              'label', id,
              'views', views,
              'visitors', visitors,
              'exits', exits
            ) ORDER BY views DESC, visitors DESC, id ASC
          )
          FROM selected_pages
        ),
        '[]'::jsonb
      ) AS nodes,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'source', source,
              'target', target,
              'views', views,
              'visitors', visitors
            ) ORDER BY views DESC, visitors DESC, source ASC, target ASC
          )
          FROM ranked_edges
        ),
        '[]'::jsonb
      ) AS edges
  `

  const responseBody: PageMapResponse = {
    from,
    to,
    timezone,
    nodes: row?.nodes ?? [],
    edges: row?.edges ?? [],
  }

  await writeCachedResponse(cacheKey, responseBody, to, timezone)
  return responseBody
}
