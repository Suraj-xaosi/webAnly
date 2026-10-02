import "server-only"
import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { fetchAllPageMapData } from "@/lib/shared/DBfunctions/fetchAllPageMapData"

const dateRangeSchema = z
  .object({
    from: z.iso.date().describe("Start date, format YYYY-MM-DD"),
    to: z.iso.date().describe("End date, format YYYY-MM-DD"),
  })
  .refine(({ from, to }) => from <= to, {
    message: "'from' must be before or equal to 'to'",
    path: ["to"],
  })

export function createPageMapTool(domainId: string, timezone: string) {
  return tool(
    async ({ from, to }) => {
      try {
        const result = await fetchAllPageMapData(domainId, from, to, timezone)
        return JSON.stringify(result)
      } catch (err) {
        console.error("[tool:get_page_map] failed:", err)
        return JSON.stringify({
          error: "Could not fetch page map data. Please try again later.",
        })
      }
    },
    {
      name: "get_page_map",
      description:
        "Returns a graph of the most-viewed pages and transitions between them for the selected date range. Use it for site-wide visitor navigation questions, rather than questions about one specific page.",
      schema: dateRangeSchema,
    }
  )
}
