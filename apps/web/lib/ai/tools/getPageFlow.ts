import "server-only"
import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { fetchFlowData } from "@/lib/shared/DBfunctions/fetchFlowData"

const dateRangeSchema = z
  .object({
    from: z.iso.date().describe("Start date, format YYYY-MM-DD"),
    to: z.iso.date().describe("End date, format YYYY-MM-DD"),
  })
  .refine(({ from, to }) => from <= to, {
    message: "'from' must be before or equal to 'to'",
    path: ["to"],
  })

export function createPageFlowTool(domainId: string, timezone: string) {
  return tool(
    async ({ page, from, to }) => {
      try {
        const result = await fetchFlowData(domainId, page, from, to, timezone)
        return JSON.stringify(result)
      } catch (err) {
        console.error("[tool:get_page_flow] failed:", err)
        return JSON.stringify({
          error: "Could not fetch page flow data. Please try again later.",
        })
      }
    },
    {
      name: "get_page_flow",
      description:
        "Returns the pages and sources visitors came from before viewing a page, the pages they visited next, and exits from that page. Use it to answer navigation questions about one specific page.",
      schema: dateRangeSchema.extend({
        page: z.string().min(1).describe("The exact page path to analyze"),
      }),
    }
  )
}
