"use client"

import { X } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { AreaChartGradient } from "@workspace/ui/components/main/areaChartGradient"
import { useDimensionTimeseries } from "@/hooks/analytics/useDimTimeseries"
import { useRealtimeDimensionTimeseries } from "@/hooks/realtime/useRealtimeDimensionTimeseries"
import { useAppDispatch } from "@/store/hooks"
import {
  closeDimensionTimeseries,
  type DimensionTimeseriesSelection,
} from "@/store/slices/dimensionTimeseriesSlice"
import { useDimensionTimeseriesContext } from "@/hooks/analytics/useDimensionTimeseriesContext"

export function DimensionTimeseriesPanel() {
  const dispatch = useAppDispatch()
  const { selection } = useDimensionTimeseriesContext()
  if (!selection) return null

  return (
    <div className="fixed right-6 bottom-6 z-50 w-[420px] max-w-[90vw]">
      <Card className="shadow-2xl ring-2 ring-foreground/10">
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="truncate capitalize">
            {selection.dimension}: {selection.value}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch(closeDimensionTimeseries())}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {selection.mode === "live" ? (
            <LiveDimensionTimeseriesChart selection={selection} />
          ) : (
            <HistoricalDimensionTimeseriesChart selection={selection} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function HistoricalDimensionTimeseriesChart({
  selection,
}: {
  selection: DimensionTimeseriesSelection
}) {
  const { domainId, from, to, timezone } = useDimensionTimeseriesContext()
  const historical = useDimensionTimeseries({
    domainId,
    from,
    to,
    dimension: selection.dimension,
    value: selection.value,
    timezone,
  })

  if (historical.isLoading) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    )
  }

  if (historical.isError) {
    return (
      <div className="py-8 text-center text-sm text-destructive">
        Failed to load data
      </div>
    )
  }

  return <AreaChartGradient data={historical.data?.data ?? []} />
}

function LiveDimensionTimeseriesChart({
  selection,
}: {
  selection: DimensionTimeseriesSelection
}) {
  const { domainId, from, to, timezone } = useDimensionTimeseriesContext()
  const realtime = useRealtimeDimensionTimeseries(
    selection.dimension,
    selection.value,
    domainId,
    from,
    to,
    true,
    timezone
  )

  if (realtime.isLoading) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    )
  }

  if (realtime.isError) {
    return (
      <div className="py-8 text-center text-sm text-destructive">
        Failed to load data
      </div>
    )
  }

  return <AreaChartGradient data={realtime.data} />
}
