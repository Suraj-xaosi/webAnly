// web/pages/LiveDashboardPage.tsx
"use client"

import { useEffect, useState } from "react"
import { useAppSelector } from "@/store/hooks"
import { selectDomainId } from "@/store/slices/dashboardSlice"
import { useRealtimeTimeseries } from "@/hooks/useRealtimeTimeseries"
import { useRealtimeDimension } from "@/hooks/useRealtimeDimension"
import { TimeseriesCard } from "@/components/timeseriesCard"
import { DimensionCard } from "@/components/dimensionCard"
import { isPro } from "../../../lib/Actions/isPro"

import { Card, CardContent } from "@workspace/ui/components/card"
import DomainSwitch from "@/components/domainSwitch"
import { useApiKey } from "@/hooks/useApikey"
import type { Dimension } from "@/hooks/useDimension"

const DIMENSIONS: Dimension[] = ["browser", "country", "device", "os", "referrer", "page"]

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
        setIsDomainPro(!("error" in result) && Boolean(result.Pro))
        setTimezone(result.timezone || "UTC")
      }
    }

    void loadAccess()

    return () => {
      ignore = true
    }
  }, [domainId])

  const today = () => new Date().toISOString().split("T")[0]!
  const from = today()
  const to = today()
  //const timezone = ""

  const { data: apikey, isPending: apikeyLoading } = useApiKey(domainId)
  const enabled = !!apikey && !apikeyLoading

  const timeseries = useRealtimeTimeseries(domainId, from, to, apikey ?? "", enabled, timezone)

  const browser = useRealtimeDimension("browser", domainId, from, to, apikey ?? "", enabled, timezone)
  const country = useRealtimeDimension("country", domainId, from, to, apikey ?? "", enabled, timezone)
  const device = useRealtimeDimension("device", domainId, from, to, apikey ?? "", enabled, timezone)
  const os = useRealtimeDimension("os", domainId, from, to, apikey ?? "", enabled, timezone)
  const referrer = useRealtimeDimension("referrer", domainId, from, to, apikey ?? "", enabled, timezone)
  const page = useRealtimeDimension("page", domainId, from, to, apikey ?? "", enabled, timezone)
  const dimensionMap = { browser, country, device, os, referrer, page }

  if (isDomainPro === false) {
    return <Card><CardContent className="p-6 text-muted-foreground">You don't have pro access for this domain.</CardContent></Card>
  }

  return (
    <div className="grid gap-6">
    <div className="flex items-center justify-between gap-4">
            <div className="w-fit">
              <DomainSwitch />
            </div>
            
        
    
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
        <>
          <TimeseriesCard
            data={timeseries.data}
            isLoading={timeseries.isLoading}
            isError={timeseries.isError}
            error={timeseries.error}
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
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}