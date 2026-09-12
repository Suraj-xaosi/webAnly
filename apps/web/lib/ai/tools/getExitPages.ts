import "server-only"
import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { fetchExitPagesData } from "@/lib/shared/functions/fetchExitPagesdata"

const EXIT_PAGES_RESULT_LIMIT = 30

export function createExitPagesTool(domainId: string, timezone: string) {
  return tool(
    async ({ from, to }) => {
      try {
        const result = await fetchExitPagesData(domainId, from, to, timezone)
        const trimmedData = result.data.slice(0, EXIT_PAGES_RESULT_LIMIT)

        return JSON.stringify({
          ...result,
          data: trimmedData,
          note:
            result.data.length > EXIT_PAGES_RESULT_LIMIT
              ? `Showing top ${EXIT_PAGES_RESULT_LIMIT} of ${result.data.length} exit pages.`
              : undefined,
        })
      } catch (err) {
        console.error("[tool:get_exit_pages] failed:", err)
        return JSON.stringify({ error: "Could not fetch exit page data. Please try again later." })
      }
    },
    {
      name: "get_exit_pages",
      description:
        "Returns the pages where visitors leave the site (exit pages) for a date range. Use it for questions such as 'Which pages do visitors leave from?'.",
      schema: z.object({
        from: z.string().describe("Start date, format YYYY-MM-DD"),
        to: z.string().describe("End date, format YYYY-MM-DD"),
      }),
    }
  )
}