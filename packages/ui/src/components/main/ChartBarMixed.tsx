"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"

import {
  CardContent,
} from "@workspace/ui/components/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"

export type DataKey = "visitors" | "views" | "avgDwell" | "viewsPerVisitor"

export interface DimensionPoint {
  name:            string;
  views:           number;
  visitors:        number;
  avgDwell:        number;   // seconds
  viewsPerVisitor: number;
}

interface BarChartProps {
  data: DimensionPoint[];
  dataKey: DataKey;
}

const chartConfig = {
  visitors: {
    label: "Visitors",
    color: "var(--chart-1)",
  },
  views: {
    label: "Views",
    color: "var(--chart-2)",
  },
  avgDwell: {
    label: "Avg Dwell Time",
    color: "var(--chart-3)",
  },
  viewsPerVisitor: {
    label: "Views per Visitor",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

function truncateLabel(value: string, maxLength = 14): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value
}

export function ChartBarMixed({ data, dataKey }: BarChartProps) {
  return (
    <CardContent>
      <ChartContainer config={chartConfig}>
        <BarChart
          accessibilityLayer
          data={data}
          layout="vertical"
          margin={{
            left: 12,
          }}
        >
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            width={110}
            tickFormatter={(value) => truncateLabel(value)}
          />
          <XAxis dataKey={dataKey} type="number" hide />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar dataKey={dataKey} fill={`var(--color-${dataKey})`} radius={5} />
        </BarChart>
      </ChartContainer>
    </CardContent>
  )
}