"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"

export const description = "A mixed bar chart"

export interface DimensionPoint {
  name:            string;
  views:           number;
  visitors:        number;
  avgDwell:        number;   // seconds
  viewsPerVisitor: number;
}

type DataKey = "visitors" | "views" | "avgDwell" | "viewsPerVisitor"

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

export function ChartBarMixed({ data, dataKey }: BarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart - Mixed</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{
              left: 0,
            }}
          >
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
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

    </Card>
  )
}