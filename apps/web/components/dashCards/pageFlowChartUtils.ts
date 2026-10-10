import type { FlowEntry, FlowResponse } from "@repo/types/analytics"

export type FlowMetric = "views" | "visitors"
export type FlowNodeRole = "incoming" | "selected" | "outgoing" | "exit"

type FlowMetrics = Pick<FlowEntry, "views" | "visitors">

export interface SankeyChartData {
  nodes: { name: string; role: FlowNodeRole; amount: number | null }[]
  links: { source: number; target: number; value: number }[]
}

type FlowNode = {
  id: string
  name: string
  role: FlowNodeRole
  amount: number | null
}

function valueForMetric(entry: FlowMetrics, metric: FlowMetric): number {
  return metric === "views" ? entry.views : entry.visitors
}

function createFlowNodes(
  data: FlowResponse,
  metric: FlowMetric,
  selectedPageMetrics?: FlowMetrics
): FlowNode[] {
  return [
    ...data.incoming.map((entry, index) => ({
      id: `incoming-${index}`,
      name: entry.name,
      role: "incoming" as const,
      amount: valueForMetric(entry, metric),
    })),
    {
      id: "selected-page",
      name: data.page,
      role: "selected" as const,
      amount: selectedPageMetrics
        ? valueForMetric(selectedPageMetrics, metric)
        : null,
    },
    ...data.outgoing.map((entry, index) => ({
      id: `outgoing-${index}`,
      name: entry.name,
      role: entry.type === "exit" ? ("exit" as const) : ("outgoing" as const),
      amount: valueForMetric(entry, metric),
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
  metric: FlowMetric,
  selectedPageMetrics?: FlowMetrics
): SankeyChartData {
  if (!data || (!data.incoming.length && !data.outgoing.length)) {
    return { nodes: [], links: [] }
  }

  const flowNodes = createFlowNodes(data, metric, selectedPageMetrics)
  const nodeIndex = new Map(flowNodes.map((node, index) => [node.id, index]))
  const selectedPageIndex = nodeIndex.get("selected-page") ?? 0

  return {
    nodes: flowNodes.map(({ name, role, amount }) => ({ name, role, amount })),
    links: [
      ...createIncomingLinks(
        data.incoming,
        nodeIndex,
        selectedPageIndex,
        metric
      ),
      ...createOutgoingLinks(
        data.outgoing,
        nodeIndex,
        selectedPageIndex,
        metric
      ),
    ],
  }
}
