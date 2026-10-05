"use client"

import { X } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { AreaChartGradient } from "@workspace/ui/components/main/areaChartGradient"
import { useDimensionTimeseries } from "@/hooks/analytics/useDimTimeseries"
import { useRealtimeDimensionTimeseries } from "@/hooks/realtime/useRealtimeDimensionTimeseries"
import { useDomainSelection } from "@/hooks/domainCrud/useDomainSelection"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  closeDimensionTimeseries,
  selectDimensionTimeseriesSelection,
  type DimensionTimeseriesSelection,
} from "@/store/slices/dimensionTimeseriesSlice"
import {
  selectFrom,
  selectInterval,
  selectTimezone,
  selectTo,
} from "@/store/slices/dashboardSlice"

export function DimensionTimeseriesPanel() {
  const dispatch = useAppDispatch()
  const { activeDomainId: domainId } = useDomainSelection()
  const selection = useAppSelector(selectDimensionTimeseriesSelection)
  const from = useAppSelector(selectFrom)
  const to = useAppSelector(selectTo)
  const interval = useAppSelector(selectInterval)
  const timezone = useAppSelector(selectTimezone) ?? "UTC"

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
            <LiveDimensionTimeseriesChart
              selection={selection}
              domainId={domainId}
              from={from}
              to={to}
              timezone={timezone}
            />
          ) : (
            <HistoricalDimensionTimeseriesChart
              selection={selection}
              domainId={domainId}
              from={from}
              to={to}
              interval={interval}
              timezone={timezone}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function HistoricalDimensionTimeseriesChart({
  selection,
  domainId,
  from,
  to,
  interval,
  timezone,
}: {
  selection: DimensionTimeseriesSelection
  domainId: string
  from: string
  to: string
  interval: ReturnType<typeof selectInterval>
  timezone: string
}) {
  const historical = useDimensionTimeseries({
    domainId,
    from,
    to,
    interval,
    dimension: selection.dimension,
    value: selection.value,
    timezone,
  })

  if (historical.isLoading) {
    return (
      <div className="grid gap-3 py-3" role="status" aria-busy="true" aria-label="Loading historical chart">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="aspect-video w-full" />
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
  domainId,
  from,
  to,
  timezone,
}: {
  selection: DimensionTimeseriesSelection
  domainId: string
  from: string
  to: string
  timezone: string
}) {
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
      <div className="grid gap-3 py-3" role="status" aria-busy="true" aria-label="Loading live chart">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="aspect-video w-full" />
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
