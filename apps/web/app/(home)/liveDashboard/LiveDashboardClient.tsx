"use client"

import { useCallback, useSyncExternalStore } from "react"
import { useAppSelector } from "@/store/hooks"
import { useDomainSelection } from "@/hooks/domainCrud/useDomainSelection"
import { selectDimensionTimeseriesSelection } from "@/store/slices/dimensionTimeseriesSlice";
import { useRealtimeTimeseries } from "@/hooks/realtime/useRealtimeTimeseries"
import { useRealtimeDimensions } from "@/hooks/realtime/useRealtimeDimensions"
import { RealtimeProvider } from "@/components/wrapper/RealtimeProvider"
import { TimeseriesCard } from "@/components/dashCards/timeseriesCard"
import { DimensionCard } from "@/components/dashCards/dimensionCard"
import { ExitPageCard } from "@/components/dashCards/exitPageCard"

import { Card, CardContent } from "@workspace/ui/components/card"
import DomainSwitch from "@/components/picker/domainSwitch"
import { useApiKey } from "@/hooks/useApikey"
import { useDomainAccess } from "@/hooks/domainCrud/useDomainAcess"
import type { Dimension } from "@repo/types/analytics"
import { DimensionTimeseriesPanel } from "@/components/dashCards/dimensionTimeseriesPanel";
import { useRealtimeExitPages } from "@/hooks/realtime/useRealtimeExitPages"

const DIMENSIONS: Dimension[] = ["browser", "country", "device", "os", "referrer", "page"]

function getDateInTimezone(timezone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date())
}

function useLiveDate(timezone: string) {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const interval = window.setInterval(onStoreChange, 30_000)
    window.addEventListener("focus", onStoreChange)
    document.addEventListener("visibilitychange", onStoreChange)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener("focus", onStoreChange)
      document.removeEventListener("visibilitychange", onStoreChange)
    }
  }, [])
  const getSnapshot = useCallback(() => getDateInTimezone(timezone), [timezone])

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export default function LiveDashboardClient() {
  const { activeDomainId: domainId } = useDomainSelection()

  const domainAccess = useDomainAccess(domainId)
  const isDomainActive = !domainId
    ? null
    : domainAccess.isError
      ? false
      : domainAccess.data?.active ?? null
  const timezone = domainAccess.data?.timezone ?? "UTC"

  const from = useLiveDate(timezone)
  const to = from

  const { data: apikey, isPending: apikeyLoading } = useApiKey(
    domainId,
    isDomainActive === true
  )
  const enabled = !!apikey && !apikeyLoading

  if (isDomainActive === false) {
    return <Card><CardContent className="p-6 text-muted-foreground">This domain is currently deactivated.</CardContent></Card>
  }

  return (
    <div className="grid min-w-0 gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <DomainSwitch />
        </div>

        {domainId && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">{timezone}</span>
            <span>·</span>
            <span>{from}</span>
          </div>
        )}
      </div>

      {!domainId ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-muted-foreground">
            Select a domain to view live data...
          </CardContent>
        </Card>
      ) : apikeyLoading ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-muted-foreground">
            Connecting to live dashboard...
          </CardContent>
        </Card>
      ) : (
        <RealtimeProvider domainId={domainId}>
          <LiveDashboardContent
            domainId={domainId}
            from={from}
            to={to}
            timezone={timezone}
            apikey={apikey ?? ""}
            enabled={enabled}
          />
        </RealtimeProvider>
      )}
    </div>
  );
}

function LiveDashboardContent({
  domainId,
  from,
  to,
  timezone,
  apikey,
  enabled,
}: {
  domainId: string
  from: string
  to: string
  timezone: string
  apikey: string
  enabled: boolean
}) {
  const timeseries = useRealtimeTimeseries(domainId, from, to, apikey, enabled, timezone)

  const dimensions = useRealtimeDimensions(domainId, from, to, enabled, timezone)
  const exitPages = useRealtimeExitPages(
    domainId,
    from,
    to,
    timezone,
    enabled,
    dimensions.page.data
  )

  const dimensionTimeseriesSelection = useAppSelector(selectDimensionTimeseriesSelection)

  return (
    <>
      <TimeseriesCard
        data={timeseries.data}
        summary={timeseries.summary}
        isLoading={timeseries.isLoading}
        isError={timeseries.isError}
        error={timeseries.error}
        isLive={timeseries.isLive}
      />

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <ExitPageCard
          data={exitPages.data}
          isLoading={exitPages.isLoading}
          isError={exitPages.isError}
          error={exitPages.error}
          onRetry={exitPages.refetch}
        />
        {DIMENSIONS.map((dimension) => {
          const result = dimensions[dimension];
          return (
            <DimensionCard
              key={dimension}
              dimension={dimension}
              data={result.data}
              isLoading={result.isLoading}
              isError={result.isError}
              error={result.error}
              isLive={result.isLive}
            />
          );
        })}
      </div>

      {dimensionTimeseriesSelection?.mode === "live" && <DimensionTimeseriesPanel />}
    </>
  )
}