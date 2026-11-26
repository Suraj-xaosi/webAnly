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
import { Button } from "@workspace/ui/components/button"
import Link from "next/link"
import DomainSwitch from "@/components/picker/domainSwitch"
import { useApiKey } from "@/hooks/useApikey"
import { useDomainAccess } from "@/hooks/domainCrud/useDomainAcess"
import { useRealtimeContext } from "@/components/wrapper/RealtimeProvider"
import type { Dimension } from "@/types/analytics"
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
  const domainSelection = useDomainSelection()
  const { activeDomainId: domainId } = domainSelection

  const domainAccess = useDomainAccess(domainId)
  const isDomainActive = domainAccess.data?.active ?? null
  const timezone = domainAccess.data?.timezone ?? "UTC"

  const from = useLiveDate(timezone)
  const to = from

  const {
    data: apikey,
    isPending: apikeyLoading,
    isError: apiKeyFailed,
    error: apiKeyError,
    refetch: refetchApiKey,
  } = useApiKey(
    domainId,
    isDomainActive === true
  )
  const enabled = !!apikey && !apikeyLoading

  if (domainSelection.isLoading && !domainSelection.data) {
    return <Card><CardContent className="p-6 text-muted-foreground">Loading your domains...</CardContent></Card>
  }

  if (domainSelection.isError && !domainSelection.data) {
    return (
      <RecoveryCard
        title="Your domains couldn’t be loaded."
        message={getErrorMessage(domainSelection.error, "Check your connection and try again.")}
        onRetry={() => void domainSelection.refetch()}
      />
    )
  }

  if (domainId && domainAccess.isError && !domainAccess.data) {
    return (
      <RecoveryCard
        title="Domain access couldn’t be checked."
        message={getErrorMessage(domainAccess.error, "Check your connection and try again.")}
        onRetry={() => void domainAccess.refetch()}
        showDomainSwitch
      />
    )
  }

  if (domainId && domainAccess.isLoading && !domainAccess.data) {
    return <Card><CardContent className="p-6 text-muted-foreground">Checking domain access...</CardContent></Card>
  }

  if (isDomainActive === false) {
    return (
      <div className="grid gap-6">
        <DomainSwitch />
        <Card>
          <CardContent className="p-6 text-muted-foreground">
            This domain is currently deactivated. Reactivate it in domain settings to view live data.
          </CardContent>
        </Card>
      </div>
    )
  }

  if (domainId && apiKeyFailed && !apikey) {
    return (
      <RecoveryCard
        title="Live dashboard setup failed."
        message={getErrorMessage(apiKeyError, "Your live access key couldn’t be loaded. Try again.")}
        onRetry={() => void refetchApiKey()}
        showDomainSwitch
      />
    )
  }

  return (
    <div className="grid min-w-0 gap-6">
      {domainSelection.isError && domainSelection.data && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-card p-4 text-sm" role="alert">
          <p>Couldn’t refresh your domains. Showing the last loaded data.</p>
          <Button variant="outline" size="sm" onClick={() => void domainSelection.refetch()}>
            Try again
          </Button>
        </div>
      )}
      {domainAccess.isError && domainAccess.data && (
        <div className="rounded-lg border border-destructive/40 bg-card p-4 text-sm" role="alert">
          Couldn’t refresh domain access. Showing the last known status.
        </div>
      )}
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
  const { connectionError, retryConnection } = useRealtimeContext()
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
      {connectionError && (
        <Card role="alert" className="border-destructive/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="grid gap-1 text-sm">
              <p className="font-medium">Live updates are unavailable.</p>
              <p className="text-muted-foreground">
                {connectionError} Loaded analytics remain visible; retry the connection or sign in again if your session expired.
              </p>
            </div>
            {connectionError.startsWith("Your session may have expired.") ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/auth">Sign in</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={retryConnection}>
                Reconnect
              </Button>
            )}
          </CardContent>
        </Card>
      )}
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

function RecoveryCard({
  title,
  message,
  onRetry,
  showDomainSwitch = false,
}: {
  title: string
  message: string
  onRetry: () => void
  showDomainSwitch?: boolean
}) {
  return (
    <div className="grid gap-6">
      {showDomainSwitch && <DomainSwitch />}
      <Card role="alert" className="border-destructive/40">
        <CardContent className="grid justify-items-start gap-3 p-6">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message
  }
  return fallback
}