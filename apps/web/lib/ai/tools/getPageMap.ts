import "server-only"
import { tool } from "@langchain/core/tools"
import { pageMapToolInputSchema } from "@repo/types/validation"
import { fetchAllPageMapData } from "@/lib/shared/DBfunctions/fetchAllPageMapData"

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
      schema: pageMapToolInputSchema,
    }
  )
}
