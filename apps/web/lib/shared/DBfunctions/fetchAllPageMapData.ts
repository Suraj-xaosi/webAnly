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

const MAX_PAGE_MAP_NODES = 14
const MAX_PAGE_MAP_EDGES = 40
const OTHER_PAGES_NODE_ID = "__all_page_map_other__"

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
        CASE
          WHEN source_page.id IS NULL THEN ${OTHER_PAGES_NODE_ID}
          ELSE visits."previousPage"
        END AS source,
        CASE
          WHEN target_page.id IS NULL THEN ${OTHER_PAGES_NODE_ID}
          ELSE visits."page"
        END AS target,
        COUNT(*)::int AS views,
        COUNT(DISTINCT visits."visitorId")::int AS visitors
      FROM "page_visit" AS visits
      LEFT JOIN selected_pages AS source_page
        ON source_page.id = visits."previousPage"
      LEFT JOIN selected_pages AS target_page
        ON target_page.id = visits."page"
      WHERE visits."domainId" = ${domainId}
        AND visits."previousPage" IS NOT NULL
        AND visits."previousPage" <> ''
        AND visits."previousPage" <> visits."page"
        AND (source_page.id IS NOT NULL OR target_page.id IS NOT NULL)
        AND visits."visitedAt"::timestamptz >= ${lowerBoundSql}
        AND visits."visitedAt"::timestamptz < ${upperBoundSql}
      GROUP BY 1, 2
      ORDER BY views DESC, visitors DESC, source ASC, target ASC
      LIMIT ${MAX_PAGE_MAP_EDGES}
    ), other_pages AS (
      SELECT
        ${OTHER_PAGES_NODE_ID} AS id,
        'Other pages' AS label,
        COUNT(*)::int AS views,
        COUNT(DISTINCT visits."visitorId")::int AS visitors,
        COUNT(*) FILTER (WHERE visits."exitType" = 'pagehide')::int AS exits
      FROM "page_visit" AS visits
      LEFT JOIN selected_pages AS selected_page
        ON selected_page.id = visits."page"
      WHERE visits."domainId" = ${domainId}
        AND visits."visitedAt"::timestamptz >= ${lowerBoundSql}
        AND visits."visitedAt"::timestamptz < ${upperBoundSql}
        AND selected_page.id IS NULL
        AND visits."page" <> ''
        AND EXISTS (
          SELECT 1
          FROM ranked_edges
          WHERE source = ${OTHER_PAGES_NODE_ID}
             OR target = ${OTHER_PAGES_NODE_ID}
        )
      HAVING COUNT(*) > 0
    ), graph_nodes AS (
      SELECT id, id AS label, views, visitors, exits
      FROM selected_pages
      UNION ALL
      SELECT id, label, views, visitors, exits
      FROM other_pages
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
          FROM graph_nodes
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
