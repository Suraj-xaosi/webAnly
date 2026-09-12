import "server-only"
import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { fetchDimensionData } from "@/lib/shared/functions/fetchDimensionData"
import type { Dimension } from "@/lib/shared/types/analytics"

// Har dimension ki apni natural "ceiling" — referrer/city unbounded ho sakte
// hain, page/browser/os naturally chhote hote hain
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
        return JSON.stringify({ error: "Dimension data fetch nahi ho paya, thodi der baad try karo." })
      }
    },
    {
      name: "get_dimension_breakdown",
      description:
        "Currently selected domain ke traffic ka breakdown deta hai kisi dimension (page, browser, device, country, city, os, referrer) ke hisaab se, ek date range ke liye. Yeh sirf isi domain ka data de sakta hai.",
      schema: z.object({
        dimension: z
          .enum(["page", "browser", "device", "country", "city", "os", "referrer"])
          .describe("Kis cheez ka breakdown chahiye"),
        from: z.string().describe("Start date, format YYYY-MM-DD"),
        to: z.string().describe("End date, format YYYY-MM-DD"),
      }),
    }
  )
}