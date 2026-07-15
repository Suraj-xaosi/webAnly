// packages/ui/src/components/main/ChartBarExit.tsx
"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"

export interface ExitPagePoint {
  name:     string;
  views:    number;
  exits:    number;
  exitRate: number;
}

export type ExitDataKey = "exits" | "exitRate"

interface ChartBarExitProps {
  data: ExitPagePoint[];
  dataKey: ExitDataKey;
}

const chartConfig = {
  exits: {
    label: "Exits",
    color: "var(--chart-1)",
  },
  exitRate: {
    label: "Exit Rate (%)",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

function truncateLabel(value: string, maxLength = 14): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value
}

export function ChartBarExit({ data, dataKey }: ChartBarExitProps) {
  return (
    <ChartContainer config={chartConfig}>
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ left: 12 }}
      >
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          tickMargin={10}
          tick={{ fontSize: 13, fontWeight: 600, fill: "var(--foreground)" }}
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
  )
}