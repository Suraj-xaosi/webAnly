"use client"

import { useEffect, useMemo, useState } from "react"
import { useAppSelector } from "@/store/hooks"
import { selectDomainId } from "@/store/slices/dashboardSlice"
import { useRealtimeTimeseries } from "@/hooks/realtime/useRealtimeTimeseries"
import { useRealtimeDimension } from "@/hooks/realtime/useRealtimeDimension"
import { RealtimeProvider } from "@/components/wrapper/RealtimeProvider"
import { TimeseriesCard } from "@/components/dashCards/timeseriesCard"
import { DimensionCard } from "@/components/dashCards/dimensionCard"
import { isPro } from "../../../lib/Actions/isPro"

import { Card, CardContent } from "@workspace/ui/components/card"
import DomainSwitch from "@/components/picker/domainSwitch"
import { useApiKey } from "@/hooks/useApikey"
import type { Dimension } from "@/hooks/analytics/useDimension"

const DIMENSIONS: Dimension[] = ["browser", "country", "device", "os", "referrer", "page"]

function getDateInTimezone(timezone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date())
}

export default function liveDashboardPage() {
  const domainId = useAppSelector(selectDomainId)
  const [isDomainPro, setIsDomainPro] = useState<boolean | null>(null)
  const [timezone, setTimezone] = useState<string>("UTC")

  useEffect(() => {
    let ignore = false

    async function loadAccess() {
      if (!domainId) {
        setIsDomainPro(null)
        return
      }

      const result = await isPro(domainId)
      if (!ignore) {
        setIsDomainPro(result.success ? result.data.pro : false)
        setTimezone(result.success ? result.data.timezone : "UTC")
      }
      
    }

    void loadAccess()

    return () => {
      ignore = true
    }
  }, [domainId])

  const from = useMemo(() => getDateInTimezone(timezone), [timezone])
  const to = from

  const { data: apikey, isPending: apikeyLoading } = useApiKey(domainId)
  const enabled = !!apikey && !apikeyLoading

  if (isDomainPro === false) {
    return <Card><CardContent className="p-6 text-muted-foreground">You don't have pro access for this domain.</CardContent></Card>
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="w-fit">
          <DomainSwitch />
        </div>

        {domainId && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
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
  const device = useRealtimeDimension("device", domainId, from, to, apikey, enabled, timezone)
  const os = useRealtimeDimension("os", domainId, from, to, apikey, enabled, timezone)
  const referrer = useRealtimeDimension("referrer", domainId, from, to, apikey, enabled, timezone)
  const page = useRealtimeDimension("page", domainId, from, to, apikey, enabled, timezone)
  const dimensionMap = useMemo(
    () => ({ browser, country, device, os, referrer, page }),
    [browser, country, device, os, referrer, page]
  )

  return (
    <>
      <TimeseriesCard
        data={timeseries.data}
        isLoading={timeseries.isLoading}
        isError={timeseries.isError}
        error={timeseries.error}
        isLive={timeseries.isLive}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
    </>
  )
}