// packages/ui/src/components/main/ChartBarExit.tsx
"use client"

import { useState } from "react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"

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

export interface ExitPagePoint {
  name: string
  views: number
  exits: number
  exitRate: number
}

export type ExitDataKey = "exits" | "exitRate"

interface ChartBarExitProps {
  data: ExitPagePoint[]
  dataKey: ExitDataKey
}

const TOP_N = 10

const chartConfig = {
  exits: { label: "Exits", color: "var(--chart-1)" },
  exitRate: { label: "Exit Rate (%)", color: "var(--chart-4)" },
} satisfies ChartConfig

function truncateLabel(value: string, maxLength = 14): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value
}

type SortKey = keyof ExitPagePoint

export function ChartBarExit({ data, dataKey }: ChartBarExitProps) {
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
    <>
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
            tick={{ fontSize: 13, fontWeight: 600, fill: "var(--foreground)" }}
            axisLine={false}
            width={110}
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
        <DialogContent className="max-h-[80vh] w-[900px] sm:max-w-[900px] max-w-[90vw] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Exit Pages</DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>
                    Page
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("views")}>
                    Views
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("exits")}>
                    Exits
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("exitRate")}>
                    Exit Rate
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-right">{row.views}</TableCell>
                    <TableCell className="text-right">{row.exits}</TableCell>
                    <TableCell className="text-right">{row.exitRate.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}