import "server-only"
import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { fetchDimensionTimeseriesData } from "@/lib/shared/DBfunctions/fetchDimensionTimeseriesData"
import { VALID_INTERVALS } from "@/lib/shared/DBfunctions/helper/analyticsConstants"

const dateRangeSchema = z
  .object({
    from: z.iso.date().describe("Start date, format YYYY-MM-DD"),
    to: z.iso.date().describe("End date, format YYYY-MM-DD"),
  })
  .refine(({ from, to }) => from <= to, {
    message: "'from' must be before or equal to 'to'",
    path: ["to"],
  })

const dimensions = [
  "page",
  "browser",
  "device",
  "country",
  "city",
  "os",
  "referrer",
] as const

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
      schema: dateRangeSchema.extend({
        dimension: z
          .enum(dimensions)
          .describe("The dimension containing the value"),
        value: z
          .string()
          .min(1)
          .describe("The exact value to trend within the selected dimension"),
        interval: z
          .enum(VALID_INTERVALS)
          .optional()
          .describe(
            "Optional bucket interval: hour, dayname, day, week, or month"
          ),
      }),
    }
  )
}
