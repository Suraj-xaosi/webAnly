import "server-only"
import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { fetchTimeseriesData } from "@/lib/shared/functions/fetchTimeseriesData"

export function createTimeseriesTool(domainId: string, timezone: string) {
  return tool(
    async ({ from, to }) => {
      try {
        const interval = from === to ? "hour" : "day"
        const result = await fetchTimeseriesData(domainId, from, to, timezone, interval)
        return JSON.stringify(result)
      } catch (err) {
        console.error("[tool:get_timeseries] failed:", err)
        return JSON.stringify({ error: "Could not fetch time-series data. Please try again later." })
      }
    },
    {
      name: "get_timeseries",
      description:
        "Returns the daily trend of views and visitors, or the hourly trend for a single day, for a date range. Use it for questions such as 'How was traffic?' or 'Show me the trend.'.",
      schema: z.object({
        from: z.string().describe("Start date, format YYYY-MM-DD"),
        to: z.string().describe("End date, format YYYY-MM-DD"),
      }),
    }
  )
}