"use client"

import { useMemo } from "react"
import { useAppSelector } from "@/store/hooks"
import { selectDomainId } from "@/store/slices/dashboardSlice"
import { selectDimensionTimeseriesSelection } from "@/store/slices/dimensionTimeseriesSlice";
import { useRealtimeTimeseries } from "@/hooks/realtime/useRealtimeTimeseries"
import { useRealtimeDimension } from "@/hooks/realtime/useRealtimeDimension"
import { RealtimeProvider } from "@/components/wrapper/RealtimeProvider"
import { TimeseriesCard } from "@/components/dashCards/timeseriesCard"
import { DimensionCard } from "@/components/dashCards/dimensionCard"

import { Card, CardContent } from "@workspace/ui/components/card"
import DomainSwitch from "@/components/picker/domainSwitch"
import { useApiKey } from "@/hooks/useApikey"
import { useDomainAccess } from "@/hooks/domainCrud/useDomainAcess"
import type { Dimension } from "@/hooks/analytics/useDimension"
import { DimensionTimeseriesPanel } from "@/components/dashCards/dimensionTimeseriesPanel";

const DIMENSIONS: Dimension[] = ["browser", "country", "device", "os", "referrer", "page"]

function getDateInTimezone(timezone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date())
}

export default function LiveDashboardPage() {
  const domainId = useAppSelector(selectDomainId)

  const domainAccess = useDomainAccess(domainId)
  const isDomainActive = !domainId
    ? null
    : domainAccess.isError
      ? false
      : domainAccess.data?.active ?? null
  const timezone = domainAccess.data?.timezone ?? "UTC"

  const from = useMemo(() => getDateInTimezone(timezone), [timezone])
  const to = from

  const { data: apikey, isPending: apikeyLoading } = useApiKey(domainId)
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
        <RealtimeProvider domainId={domainId} apikey={apikey ?? ""}>
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

  const browser = useRealtimeDimension("browser", domainId, from, to, apikey, enabled, timezone)
  const country = useRealtimeDimension("country", domainId, from, to, apikey, enabled, timezone)
  const city = useRealtimeDimension("city", domainId, from, to, apikey, enabled, timezone)
  const device = useRealtimeDimension("device", domainId, from, to, apikey, enabled, timezone)
  const os = useRealtimeDimension("os", domainId, from, to, apikey, enabled, timezone)
  const referrer = useRealtimeDimension("referrer", domainId, from, to, apikey, enabled, timezone)
  const page = useRealtimeDimension("page", domainId, from, to, apikey, enabled, timezone)

  const dimensionMap = useMemo(
    () => ({ browser, country, city, device, os, referrer, page }),
    [browser, country, city, device, os, referrer, page]
  )
  const dimensionTimeseriesSelection = useAppSelector(selectDimensionTimeseriesSelection)

  return (
    <>
      <TimeseriesCard
        data={timeseries.data}
        isLoading={timeseries.isLoading}
        isError={timeseries.isError}
        error={timeseries.error}
        isLive={timeseries.isLive}
      />

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        {DIMENSIONS.map((dimension) => {
          const result = dimensionMap[dimension];
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