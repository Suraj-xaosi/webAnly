import "server-only"
import { createAgent } from "langchain"
import { model } from "./model"
import { createDimensionTool } from "./tools/getDimension"
import { createDimensionTimeseriesTool } from "./tools/getDimensionTimeseries"
import { createTimeseriesTool } from "./tools/getTimeseries"
import { createExitPagesTool } from "./tools/getExitPages"
import { createPageFlowTool } from "./tools/getPageFlow"
import { createPageMapTool } from "./tools/getPageMap"

export function buildAnalyticsAgent(domainId: string, timezone: string) {
  const tools = [
    createDimensionTool(domainId, timezone),
    createTimeseriesTool(domainId, timezone),
    createExitPagesTool(domainId, timezone),
    createPageFlowTool(domainId, timezone),
    createPageMapTool(domainId, timezone),
    createDimensionTimeseriesTool(domainId, timezone),
  ]

  return createAgent({ model, tools })
}
