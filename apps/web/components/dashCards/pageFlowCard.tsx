"use client"

import { useMemo, useState, type ReactNode } from "react"
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
import { InfoIcon } from "lucide-react"
import { PageNetworkGraph } from "@workspace/ui/components/main/pageNetworkGraph"
import {
  Tooltip as HelpTooltip,
  TooltipContent as HelpTooltipContent,
  TooltipTrigger as HelpTooltipTrigger,
} from "@workspace/ui/components/tooltip"
import type { FlowResponse, ApiError } from "@/hooks/analytics/useFlow"
import { AnalyticsCardState } from "./analyticsCardState"
import {
  ALL_PAGE_MAP_VALUE,
  type PageMapResponse,
} from "@/lib/shared/types/analytics"
import {
  buildPageFlowChartData,
  type FlowMetric,
  type FlowNodeRole,
} from "./pageFlowChartUtils"

export interface PageFlowCardProps {
  data: FlowResponse | undefined
  selectedPageMetrics?: { views: number; visitors: number }
  allPageMapData: PageMapResponse | undefined
  allPageMapLoading: boolean
  allPageMapError?: ApiError | null
  onRetryAllPageMap?: () => void
  isAllPageMap: boolean
  availablePages: string[]
  selectedPage: string
  onPageChange: (page: string) => void
  isPagesLoading: boolean
  isPagesError: boolean
  pagesError?: ApiError | null
  onRetryPages?: () => void
  isLoading: boolean
  isError: boolean
  error?: ApiError | null
  onRetryFlow?: () => void
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
  allPageMapData,
  allPageMapLoading,
  allPageMapError,
  onRetryAllPageMap,
  isAllPageMap,
  availablePages,
  selectedPage,
  onPageChange,
  isPagesLoading,
  isPagesError,
  pagesError,
  onRetryPages,
  isLoading,
  isError,
  error,
  onRetryFlow,
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
  let visualization: ReactNode

  if (isAllPageMap) {
    if (allPageMapLoading && !allPageMapData) {
      visualization = (
        <AnalyticsCardState isLoading isError={false} />
      )
    } else if (allPageMapError && !allPageMapData) {
      visualization = (
        <AnalyticsCardState
          isLoading={false}
          isError
          error={allPageMapError}
          onRetry={onRetryAllPageMap}
        />
      )
    } else {
      visualization = (
        <>
          {allPageMapError && (
            <AnalyticsCardState
              isLoading={false}
              isError
              error={allPageMapError}
              hasData
              onRetry={onRetryAllPageMap}
            />
          )}
          <PageNetworkGraph
            nodes={allPageMapData?.nodes ?? []}
            edges={allPageMapData?.edges ?? []}
            metric={metric}
          />
        </>
      )
    }
  } else if (isPagesLoading) {
    visualization = (
      <AnalyticsCardState isLoading isError={false} />
    )
  } else if (isPagesError) {
    visualization = (
      <AnalyticsCardState
        isLoading={false}
        isError
        error={pagesError}
        onRetry={onRetryPages}
      />
    )
  } else if (!availablePages.length) {
    visualization = (
      <div className="px-6 pb-6 text-sm text-muted-foreground">
        No pages are available for this time range.
      </div>
    )
  } else if (isLoading && !data) {
    visualization = (
      <AnalyticsCardState isLoading isError={false} />
    )
  } else if (isError && !data) {
    visualization = (
      <AnalyticsCardState
        isLoading={false}
        isError
        error={error}
        onRetry={onRetryFlow}
      />
    )
  } else if (!data || (!data.incoming.length && !data.outgoing.length)) {
    visualization = (
      <div className="px-6 pb-6 text-sm text-muted-foreground">
        No page-flow data for {selectedPage || "this time range"}.
      </div>
    )
  } else {
    visualization = (
      <div className="overflow-x-auto px-4 pb-2">
        <div className="min-w-[760px]" style={{ height: chartHeight }}>
          {isError && (
            <AnalyticsCardState
              isLoading={false}
              isError
              error={error}
              hasData
              onRetry={onRetryFlow}
            />
          )}
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
    )
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <CardTitle>{isAllPageMap ? "All Page Map" : "Page Flow"}</CardTitle>
          <HelpTooltip>
            <HelpTooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={
                  isAllPageMap
                    ? "About the All Page Map"
                    : "About the selected page flow"
                }
              >
                <InfoIcon className="size-4" aria-hidden="true" />
              </button>
            </HelpTooltipTrigger>
            <HelpTooltipContent
              side="bottom"
              className="max-w-sm items-start whitespace-normal"
            >
              {isAllPageMap ? (
                <p>
                  “Other pages” is a group, not an extra page on your site. It
                  represents transitions whose previous or current page is not
                  among the pages shown for this date range. For example, a
                  visit can point back to a page visited before the range
                  started. The group’s totals combine these visits; they are
                  not counts for one real page.
                </p>
              ) : (
                <p>
                  This view shows visits into and out of the selected page.
                  “Direct / None” means no same-site previous page was
                  recorded. “Other incoming pages” and “Other outgoing pages”
                  group lower-ranked paths; they are not individual pages.
                </p>
              )}
            </HelpTooltipContent>
          </HelpTooltip>
        </div>
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
              <SelectItem key={ALL_PAGE_MAP_VALUE} value={ALL_PAGE_MAP_VALUE}>
                All Page Map
              </SelectItem>
              {availablePages
                .filter(
                  (page) =>
                    page !== ALL_PAGE_MAP_VALUE && page.trim().length > 0
                )
                .map((page) => (
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

      {visualization}

      {!isAllPageMap && (
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
      )}

      <div className="px-6 pb-4 text-xs text-muted-foreground">
        {isAllPageMap
          ? "Showing the top pages and their transitions for this time range."
          : `Showing incoming and outgoing transitions for ${selectedPage || "the selected page"}.`}
      </div>
    </Card>
  )
}
