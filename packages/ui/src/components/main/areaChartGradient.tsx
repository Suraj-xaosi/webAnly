"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"

export interface TimeseriesPoint {
  date: string;
  views: number;
  visitors: number;
}

const chartConfig = {
  views: {
    label: "views",
    color: "var(--chart-1)",
  },
  visitors: {
    label: "visitors",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

interface AreaChartGradientProps {
  data: TimeseriesPoint[];
}

export function AreaChartGradient({ data }: AreaChartGradientProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Area Chart - Gradient</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-views)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-views)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-visitors)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-visitors)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="views"
              type="natural"
              fill="url(#fillViews)"
              fillOpacity={0.4}
              stroke="var(--color-views)"
              stackId="a"
            />
            <Area
              dataKey="visitors"
              type="natural"
              fill="url(#fillVisitors)"
              fillOpacity={0.4}
              stroke="var(--color-visitors)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    
    </Card>
  )
}