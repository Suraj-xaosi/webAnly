import "server-only"
import { createAgent } from "langchain"
import { model } from "./model"
import { createDimensionTool } from "./tools/getDimension"
import { createTimeseriesTool } from "./tools/getTimeseries"
import { createExitPagesTool } from "./tools/getExitPages"

export function buildAnalyticsAgent(domainId: string, timezone: string) {
  const tools = [
    createDimensionTool(domainId, timezone),
    createTimeseriesTool(domainId, timezone),
    createExitPagesTool(domainId, timezone),
  ]

  return createAgent({ model, tools })
}