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
import { ResponsiveContainer, Sankey, Tooltip } from "recharts"
import type { FlowResponse, ApiError } from "@/hooks/analytics/useFlow"
import {
  buildPageFlowChartData,
  type FlowMetric,
} from "./pageFlowChartUtils"

export interface PageFlowCardProps {
  data: FlowResponse | undefined
  availablePages: string[]
  selectedPage: string
  onPageChange: (page: string) => void
  isLoading: boolean
  isError: boolean
  error?: ApiError | null
}

const METRIC_OPTIONS: { value: FlowMetric; label: string }[] = [
  { value: "views", label: "Views" },
  { value: "visitors", label: "Visitors" },
] as const

function formatMetricValue(value: number) {
  return value.toLocaleString()
}

export function PageFlowCard({
  data,
  availablePages,
  selectedPage,
  onPageChange,
  isLoading,
  isError,
  error,
}: PageFlowCardProps) {
  const [metric, setMetric] = useState<FlowMetric>("views")
  const chartData = useMemo(() => buildPageFlowChartData(data, metric), [data, metric])

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error: {error?.message}</div>

  return (
    <Card className="col-span-full">
      <CardHeader className="flex items-center justify-between gap-2">
        <CardTitle>Page Flow</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={selectedPage} onValueChange={onPageChange} disabled={availablePages.length === 0}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a page" />
            </SelectTrigger>
            <SelectContent>
              {availablePages.map((page) => (
                <SelectItem key={page} value={page}>
                  {page}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={metric} onValueChange={(value) => setMetric(value as FlowMetric)}>
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

      {!data || (!data.incoming.length && !data.outgoing.length) ? (
        <div className="px-6 pb-6 text-sm text-muted-foreground">
          No page-flow data for {selectedPage || "this time range"}.
        </div>
      ) : (
        <div className="h-[320px] px-4 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <Sankey
              data={chartData}
              nodePadding={20}
              margin={{ top: 12, right: 24, bottom: 12, left: 24 }}
              nodeWidth={18}
              link={{ stroke: "rgba(148, 163, 184, 0.45)" }}
              iterations={64}
            >
              <Tooltip
                contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                formatter={(value) => [formatMetricValue(Number(value ?? 0)), metric === "views" ? "Views" : "Visitors"]}
              />
            </Sankey>
          </ResponsiveContainer>
        </div>
      )}

      <div className="px-6 pb-4 text-xs text-muted-foreground">
        Showing incoming and outgoing transitions for {selectedPage || "the selected page"}.
      </div>
    </Card>
  )
}
