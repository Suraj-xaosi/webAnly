import "server-only"
import { tool } from "@langchain/core/tools"
import { dimensionTimeseriesToolInputSchema } from "@repo/types/validation"
import { fetchDimensionTimeseriesData } from "@/lib/shared/DBfunctions/fetchDimensionTimeseriesData"

export function createDimensionTimeseriesTool(
  domainId: string,
  timezone: string
) {
  return tool(
    async ({ dimension, value, from, to, interval }) => {
      try {
        const effectiveInterval = from === to ? "hour" : (interval ?? "day")
        const result = await fetchDimensionTimeseriesData(
          domainId,
          dimension,
          value,
          from,
          to,
          timezone,
          effectiveInterval
        )
        return JSON.stringify(result)
      } catch (err) {
        console.error("[tool:get_dimension_timeseries] failed:", err)
        return JSON.stringify({
          error:
            "Could not fetch dimension time-series data. Please try again later.",
        })
      }
    },
    {
      name: "get_dimension_timeseries",
      description:
        "Returns a time trend of views and visitors for one specific page, browser, device, country, city, OS, or referrer. Use it when a question asks how a particular dimension value changed over time.",
      schema: dimensionTimeseriesToolInputSchema,
    }
  )
}
