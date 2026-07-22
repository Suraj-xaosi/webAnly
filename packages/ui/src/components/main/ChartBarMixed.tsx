"use client"

import { useState } from "react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@workspace/ui/components/table"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"

export type DataKey = "visitors" | "views" | "avgDwell" | "viewsPerVisitor"

export interface DimensionPoint {
  name: string
  views: number
  visitors: number
  avgDwell: number
  viewsPerVisitor: number
}

interface BarChartProps {
  data: DimensionPoint[]
  dataKey: DataKey
  title?: string // optional dialog title (e.g. "Country Data")
}

const TOP_N = 10

const chartConfig = {
  visitors: { label: "Visitors", color: "var(--chart-1)" },
  views: { label: "Views", color: "var(--chart-2)" },
  avgDwell: { label: "Avg Dwell Time", color: "var(--chart-3)" },
  viewsPerVisitor: { label: "Views per Visitor", color: "var(--chart-4)" },
} satisfies ChartConfig

function truncateLabel(value: string, maxLength = 14): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value
}

function formatDwell(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}m ${s}s`
}

type SortKey = keyof Omit<DimensionPoint, "name"> | "name"

export function ChartBarMixed({ data, dataKey, title = "Details" }: BarChartProps) {
  const [open, setOpen] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>(dataKey)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const visible = data.slice(0, TOP_N)
  const hasMore = data.length > TOP_N

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey]
    const bv = b[sortKey]
    const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number)
    return sortDir === "asc" ? cmp : -cmp
  })

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  return (
    <CardContent>
      <ChartContainer config={chartConfig}>
        <BarChart
          accessibilityLayer
          data={visible}
          layout="vertical"
          margin={{ left: 12 }}
        >
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            width={110}
            tick={{ fontSize: 13, fontWeight: 600, fill: "var(--foreground)" }}
            tickFormatter={(value) => truncateLabel(value)}
          />
          <XAxis dataKey={dataKey} type="number" hide />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey={dataKey} fill={`var(--color-${dataKey})`} radius={5} />
        </BarChart>
      </ChartContainer>

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full text-muted-foreground"
          onClick={() => setOpen(true)}
        >
          View all {data.length} →
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] sm:max-w-4xl overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>
                    Name
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("visitors")}>
                    Visitors
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("views")}>
                    Views
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("avgDwell")}>
                    Avg Dwell
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("viewsPerVisitor")}>
                    Views/Visitor
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-right">{row.visitors}</TableCell>
                    <TableCell className="text-right">{row.views}</TableCell>
                    <TableCell className="text-right">{formatDwell(row.avgDwell)}</TableCell>
                    <TableCell className="text-right">{row.viewsPerVisitor.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </CardContent>
  )
}