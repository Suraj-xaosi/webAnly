import type { FlowEntry, FlowResponse } from "@/lib/shared/types/analytics"

export type FlowMetric = "views" | "visitors"

export interface SankeyChartData {
  nodes: { name: string }[]
  links: { source: number; target: number; value: number }[]
}

type FlowNode = {
  id: string
  name: string
}

function valueForMetric(entry: FlowEntry, metric: FlowMetric): number {
  return metric === "views" ? entry.views : entry.visitors
}

function createFlowNodes(data: FlowResponse): FlowNode[] {
  return [
    ...data.incoming.map((entry, index) => ({
      id: `incoming-${index}`,
      name: entry.name,
    })),
    { id: "selected-page", name: data.page },
    ...data.outgoing.map((entry, index) => ({
      id: `outgoing-${index}`,
      name: entry.name,
    })),
  ]
}

function createIncomingLinks(
  entries: FlowEntry[],
  nodeIndex: Map<string, number>,
  selectedPageIndex: number,
  metric: FlowMetric
) {
  return entries.map((entry, index) => ({
    source: nodeIndex.get(`incoming-${index}`) ?? 0,
    target: selectedPageIndex,
    value: valueForMetric(entry, metric),
  }))
}

function createOutgoingLinks(
  entries: FlowEntry[],
  nodeIndex: Map<string, number>,
  selectedPageIndex: number,
  metric: FlowMetric
) {
  return entries.map((entry, index) => ({
    source: selectedPageIndex,
    target: nodeIndex.get(`outgoing-${index}`) ?? 0,
    value: valueForMetric(entry, metric),
  }))
}

export function buildPageFlowChartData(
  data: FlowResponse | undefined,
  metric: FlowMetric
): SankeyChartData {
  if (!data || (!data.incoming.length && !data.outgoing.length)) {
    return { nodes: [], links: [] }
  }

  const flowNodes = createFlowNodes(data)
  const nodeIndex = new Map(flowNodes.map((node, index) => [node.id, index]))
  const selectedPageIndex = nodeIndex.get("selected-page") ?? 0

  return {
    nodes: flowNodes.map((node) => ({ name: node.name })),
    links: [
      ...createIncomingLinks(data.incoming, nodeIndex, selectedPageIndex, metric),
      ...createOutgoingLinks(data.outgoing, nodeIndex, selectedPageIndex, metric),
    ],
  }
}
