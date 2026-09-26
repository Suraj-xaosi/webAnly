"use client"

import { useMemo, useState } from "react"
import { Card, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  ResponsiveContainer,
  Sankey,
  Tooltip,
  type SankeyLinkProps,
  type SankeyNodeProps,
} from "recharts"
import type { FlowResponse, ApiError } from "@/hooks/analytics/useFlow"
import {
  buildPageFlowChartData,
  type FlowMetric,
  type FlowNodeRole,
} from "./pageFlowChartUtils"

export interface PageFlowCardProps {
  data: FlowResponse | undefined
  selectedPageMetrics?: { views: number; visitors: number }
  availablePages: string[]
  selectedPage: string
  onPageChange: (page: string) => void
  isPagesLoading: boolean
  isPagesError: boolean
  pagesError?: ApiError | null
  isLoading: boolean
  isError: boolean
  error?: ApiError | null
}

const METRIC_OPTIONS: { value: FlowMetric; label: string }[] = [
  { value: "views", label: "Views" },
  { value: "visitors", label: "Visitors" },
] as const

const FLOW_COLORS: Record<FlowNodeRole, string> = {
  incoming: "var(--chart-1)",
  selected: "var(--accent)",
  outgoing: "var(--chart-2)",
  exit: "var(--destructive)",
}

const FLOW_LEGEND: { role: FlowNodeRole; label: string }[] = [
  { role: "incoming", label: "Incoming" },
  { role: "selected", label: "Selected page" },
  { role: "outgoing", label: "Outgoing" },
  { role: "exit", label: "Exit" },
]

const LINK_WIDTH_SCALE = 0.25

function formatMetricValue(value: number) {
  return value.toLocaleString()
}

function shortenName(name: string) {
  return name.length > 24 ? `${name.slice(0, 21)}...` : name
}

function renderFlowNode(
  { x, y, width, height, payload }: SankeyNodeProps,
  metric: FlowMetric
) {
  const node = payload as SankeyNodeProps["payload"] & {
    role: FlowNodeRole
    amount: number | null
  }
  const color = FLOW_COLORS[node.role]
  const isSelected = node.role === "selected"
  const textX = isSelected
    ? x + width / 2
    : node.role === "incoming"
      ? x - 12
      : x + width + 12
  const textY = isSelected ? y - 18 : y + height / 2 - 7
  const textAnchor = isSelected
    ? "middle"
    : node.role === "incoming"
      ? "end"
      : "start"

  return (
    <g>
      <title>{node.name}</title>
      <rect x={x} y={y} width={width} height={height} rx={4} fill={color} />
      <text
        x={textX}
        y={textY}
        textAnchor={textAnchor}
        fill="var(--foreground)"
        fontSize={12}
        fontWeight={600}
      >
        <tspan x={textX}>{shortenName(node.name)}</tspan>
        {node.amount !== null && (
          <tspan
            x={textX}
            dy={14}
            fill="var(--muted-foreground)"
            fontSize={11}
            fontWeight={400}
          >
            {formatMetricValue(node.amount)}{" "}
            {metric === "views" ? "views" : "visitors"}
          </tspan>
        )}
      </text>
    </g>
  )
}

function renderFlowLink({
  sourceX,
  sourceY,
  sourceControlX,
  targetX,
  targetY,
  targetControlX,
  linkWidth,
  payload,
}: SankeyLinkProps) {
  const source = payload.source as typeof payload.source & {
    role?: FlowNodeRole
  }
  const target = payload.target as typeof payload.target & {
    role?: FlowNodeRole
  }
  const role =
    target.role === "exit"
      ? "exit"
      : source.role === "incoming"
        ? "incoming"
        : "outgoing"

  return (
    <path
      d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none"
      stroke={FLOW_COLORS[role]}
      strokeWidth={linkWidth * LINK_WIDTH_SCALE}
      strokeOpacity={0.32}
      strokeLinecap="round"
    />
  )
}

export function PageFlowCard({
  data,
  selectedPageMetrics,
  availablePages,
  selectedPage,
  onPageChange,
  isPagesLoading,
  isPagesError,
  pagesError,
  isLoading,
  isError,
  error,
}: PageFlowCardProps) {
  const [metric, setMetric] = useState<FlowMetric>("views")
  const chartData = useMemo(
    () => buildPageFlowChartData(data, metric, selectedPageMetrics),
    [data, metric, selectedPageMetrics]
  )
  const maxColumnNodes = Math.max(
    data?.incoming.length ?? 0,
    data?.outgoing.length ?? 0,
    1
  )
  const chartHeight = Math.max(360, maxColumnNodes * 42)
  const nodeRenderer = useMemo(
    () => (props: SankeyNodeProps) => renderFlowNode(props, metric),
    [metric]
  )

  return (
    <Card className="col-span-full">
      <CardHeader className="flex items-center justify-between gap-2">
        <CardTitle>Page Flow</CardTitle>
        <div className="flex items-center gap-2">
          <Select
            value={selectedPage || undefined}
            onValueChange={onPageChange}
            disabled={
              isPagesLoading || isPagesError || availablePages.length === 0
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue
                placeholder={
                  isPagesLoading ? "Loading pages..." : "Select a page"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availablePages.map((page) => (
                <SelectItem key={page} value={page}>
                  {page}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={metric}
            onValueChange={(value) => setMetric(value as FlowMetric)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METRIC_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      {isPagesLoading ? (
        <div className="px-6 pb-6 text-sm text-muted-foreground">
          Loading available pages...
        </div>
      ) : isPagesError ? (
        <div className="px-6 pb-6 text-sm text-destructive">
          {pagesError?.message ??
            "Unable to load available pages. Please try again."}
        </div>
      ) : !availablePages.length ? (
        <div className="px-6 pb-6 text-sm text-muted-foreground">
          No pages are available for this time range.
        </div>
      ) : isLoading ? (
        <div className="px-6 pb-6 text-sm text-muted-foreground">
          Loading page flow...
        </div>
      ) : isError ? (
        <div className="px-6 pb-6 text-sm text-destructive">
          {error?.message ?? "Unable to load page flow. Please try again."}
        </div>
      ) : !data || (!data.incoming.length && !data.outgoing.length) ? (
        <div className="px-6 pb-6 text-sm text-muted-foreground">
          No page-flow data for {selectedPage || "this time range"}.
        </div>
      ) : (
        <div className="overflow-x-auto px-4 pb-2">
          <div className="min-w-[760px]" style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <Sankey
                data={chartData}
                node={nodeRenderer}
                nodePadding={16}
                margin={{ top: 40, right: 140, bottom: 12, left: 140 }}
                nodeWidth={16}
                link={renderFlowLink}
                iterations={48}
              >
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                  }}
                  formatter={(value) => [
                    formatMetricValue(Number(value ?? 0)),
                    metric === "views" ? "Views" : "Visitors",
                  ]}
                />
              </Sankey>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div
        className="flex flex-wrap gap-x-5 gap-y-2 px-6 pb-3 text-xs text-muted-foreground"
        aria-label="Page flow categories"
      >
        {FLOW_LEGEND.map(({ role, label }) => (
          <span key={role} className="inline-flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: FLOW_COLORS[role] }}
            />
            {label}
          </span>
        ))}
      </div>

      <div className="px-6 pb-4 text-xs text-muted-foreground">
        Showing incoming and outgoing transitions for{" "}
        {selectedPage || "the selected page"}.
      </div>
    </Card>
  )
}
