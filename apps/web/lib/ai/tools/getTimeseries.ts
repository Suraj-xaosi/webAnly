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
        return JSON.stringify({ error: "Timeseries data fetch nahi ho paya, thodi der baad try karo." })
      }
    },
    {
      name: "get_timeseries",
      description:
        "Din-wise (ya same-day ke liye hour-wise) views aur visitors ka trend deta hai, ek date range ke liye. 'Traffic kaisa raha', 'trend dikhao' jaise sawaalon ke liye use karo.",
      schema: z.object({
        from: z.string().describe("Start date, format YYYY-MM-DD"),
        to: z.string().describe("End date, format YYYY-MM-DD"),
      }),
    }
  )
}