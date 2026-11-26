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
    if (!historical.data) {
      return (
        <PanelFailure
          error={historical.error}
          onRetry={() => void historical.refetch()}
        />
      )
    }

    return (
      <div className="grid gap-3">
        <PanelFailure
          error={historical.error}
          hasData
          onRetry={() => void historical.refetch()}
        />
        <AreaChartGradient data={historical.data.data} />
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
    if (!realtime.data.length) {
      return (
        <PanelFailure
          error={realtime.error}
          onRetry={() => void realtime.refetch()}
        />
      )
    }

    return (
      <div className="grid gap-3">
        <PanelFailure
          error={realtime.error}
          hasData
          onRetry={() => void realtime.refetch()}
        />
        <AreaChartGradient data={realtime.data} />
      </div>
    )
  }

  return <AreaChartGradient data={realtime.data} />
}

function PanelFailure({
  error,
  hasData = false,
  onRetry,
}: {
  error: unknown
  hasData?: boolean
  onRetry: () => void
}) {
  const message =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
      ? error.message
      : "Check your connection and try again."

  return (
    <div
      className="grid justify-items-start gap-2 rounded-md border border-destructive/40 p-3 text-sm"
      role="alert"
    >
      <p className="font-medium">
        {hasData ? "Showing saved data; refresh failed." : "This chart couldn’t load."}
      </p>
      <p className="text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
