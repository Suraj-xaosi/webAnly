import "server-only"
import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { fetchDimensionData } from "@/lib/shared/functions/fetchDimensionData"
import type { Dimension } from "@/lib/shared/types/analytics"

// Each dimension has a practical result limit: referrers and cities can be
// unbounded, while pages, browsers, and operating systems are naturally smaller.
const DIMENSION_RESULT_LIMIT: Record<Dimension, number> = {
  page: 50,
  country: 50,
  browser: 15,
  os: 15,
  device: 5,
  city: 30,
  referrer: 30,
}

export function createDimensionTool(domainId: string, timezone: string) {
  return tool(
    async ({ dimension, from, to }) => {
      try {
        const result = await fetchDimensionData(domainId, dimension, from, to, timezone)
        const limit = DIMENSION_RESULT_LIMIT[dimension] ?? 20
        const trimmedData = result.data.slice(0, limit)

        return JSON.stringify({
          ...result,
          data: trimmedData,
          note:
            result.data.length > limit
              ? `Showing top ${limit} of ${result.data.length} results, sorted by views.`
              : undefined,
        })
      } catch (err) {
        console.error("[tool:get_dimension_breakdown] failed:", err)
        return JSON.stringify({ error: "Could not fetch dimension data. Please try again later." })
      }
    },
    {
      name: "get_dimension_breakdown",
      description:
        "Returns a traffic breakdown for the currently selected domain by dimension (page, browser, device, country, city, OS, or referrer) for a date range. It can only return data for this domain.",
      schema: z.object({
        dimension: z
          .enum(["page", "browser", "device", "country", "city", "os", "referrer"])
          .describe("The dimension to break down"),
        from: z.string().describe("Start date, format YYYY-MM-DD"),
        to: z.string().describe("End date, format YYYY-MM-DD"),
      }),
    }
  )
}