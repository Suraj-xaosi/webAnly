import "server-only"
import { prisma } from "@repo/db"
import { DAY_NAMES, MONTH_NAMES, TRUNC_FOR, type Interval } from "./analyticsConstants"
import { getAnalyticsDateBounds, readCachedResponse, writeCachedResponse } from "./analyticsRouteUtils"
import type { TimeseriesResponse } from "@/lib/shared/types/analytics"

export async function fetchTimeseriesData(
  domainId: string,
  from: string,
  to: string,
  timezone: string,
  interval: Interval = from === to ? "hour" : "day"
): Promise<TimeseriesResponse> {
  const cacheKey = `timeseries:${domainId}:${interval}:${from}:${to}:${timezone}`

  const cachedResponse = await readCachedResponse<TimeseriesResponse>(cacheKey)
  if (cachedResponse) return await cachedResponse.json()

  const { lowerBoundSql, upperBoundSql } = getAnalyticsDateBounds(from, to, timezone)

  let data: { date: string; views: number; visitors: number }[]

  if (interval === "week") {
    type WeekRow = { week_num: number; views: number; visitors: number }
    const rows = await prisma.$queryRaw<WeekRow[]>`
      SELECT
        ((EXTRACT(DAY FROM ("visitedAt"::timestamptz AT TIME ZONE ${timezone}))::int - 1) / 7) + 1 AS week_num,
        COUNT(*)::int AS views,
        COUNT(DISTINCT "visitorId")::int AS visitors
      FROM "PageVisit"
      WHERE "domainId" = ${domainId}
        AND "visitedAt"::timestamptz >= ${lowerBoundSql}
        AND "visitedAt"::timestamptz < ${upperBoundSql}
      GROUP BY 1
      ORDER BY 1 ASC
    `
    data = rows.map((row) => ({ date: `week${row.week_num}`, views: row.views, visitors: row.visitors }))
  } else {
    type Row = { bucket: Date; views: number; visitors: number }
    const trunc = TRUNC_FOR[interval]

    const rows = await prisma.$queryRaw<Row[]>`
      SELECT
        date_trunc(${trunc}, "visitedAt"::timestamptz AT TIME ZONE ${timezone}) AS bucket,
        COUNT(*)::int AS views,
        COUNT(DISTINCT "visitorId")::int AS visitors
      FROM "PageVisit"
      WHERE "domainId" = ${domainId}
        AND "visitedAt"::timestamptz >= ${lowerBoundSql}
        AND "visitedAt"::timestamptz < ${upperBoundSql}
      GROUP BY 1
      ORDER BY 1 ASC
    `

    data = rows.map((row) => {
      let date: string
      switch (interval) {
        case "hour": {
          const hours = row.bucket.getUTCHours()
          const period = hours >= 12 ? "pm" : "am"
          const hour12 = hours % 12 === 0 ? 12 : hours % 12
          date = `${hour12}${period}`
          break
        }
        case "dayname":
          date = DAY_NAMES[row.bucket.getUTCDay()]!
          break
        case "day":
          date = row.bucket.toISOString().split("T")[0] ?? ""
          break
        case "month":
          date = `${MONTH_NAMES[row.bucket.getUTCMonth()]}-${row.bucket.getUTCFullYear()}`
          break
        default:
          date = row.bucket.toISOString()
      }
      return { date, views: row.views, visitors: row.visitors }
    })
  }

  const responseBody: TimeseriesResponse = { interval, from, to, timezone, data }
  await writeCachedResponse(cacheKey, responseBody, to, timezone)
  return responseBody
}