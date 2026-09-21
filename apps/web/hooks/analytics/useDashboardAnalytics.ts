import { useCallback, useMemo, useState } from "react"
import { useDimension, type Dimension } from "./useDimension"
import { useExitPages } from "./useExitPages"
import { useFlow } from "./useFlow"
import { useTimeseries } from "./useTimeseries"

const DIMENSIONS: Dimension[] = ["browser", "country", "city", "device", "os", "referrer", "page"]

export function useDashboardAnalytics({
  domainId,
  from,
  to,
  interval,
  timezone,
}: {
  domainId: string
  from: string
  to: string
  interval: Parameters<typeof useTimeseries>[0]["interval"]
  timezone?: string
}) {
  const timeseries = useTimeseries({ domainId, from, to, interval, timezone })
  const browser = useDimension({ domainId, from, to, dimension: "browser", timezone })
  const country = useDimension({ domainId, from, to, dimension: "country", timezone })
  const city = useDimension({ domainId, from, to, dimension: "city", timezone })
  const device = useDimension({ domainId, from, to, dimension: "device", timezone })
  const os = useDimension({ domainId, from, to, dimension: "os", timezone })
  const referrer = useDimension({ domainId, from, to, dimension: "referrer", timezone })
  const page = useDimension({ domainId, from, to, dimension: "page", timezone })
  const exitPages = useExitPages({ domainId, from, to, timezone })
  const flowPages = useMemo(() => page.data?.data.map((item) => item.name) ?? [], [page.data])
  const [selectedFlowPage, setSelectedFlowPage] = useState("")
  const pagesAreLoading = page.isFetching
  const activeFlowPage = !pagesAreLoading && flowPages.includes(selectedFlowPage)
    ? selectedFlowPage
    : !pagesAreLoading
      ? flowPages[0] ?? ""
      : ""
  const pageFlow = useFlow({ domainId, page: activeFlowPage, from, to, timezone })

  const dimensionMap = { browser, country, city, device, os, referrer, page }
  const dataError = [timeseries, exitPages, browser, country, city, device, os, referrer, page, pageFlow]
    .find((result) => result.isError && result.error)
    ?.error
  const setSelectedFlowPageIfAvailable = useCallback((nextPage: string) => {
    if (flowPages.includes(nextPage)) setSelectedFlowPage(nextPage)
  }, [flowPages])

  return {
    timeseries,
    exitPages,
    dimensionMap,
    dimensions: DIMENSIONS,
    flowPages,
    activeFlowPage,
    pageFlow,
    pagesAreLoading,
    pagesError: page.error,
    isPagesError: page.isError,
    dataError,
    setSelectedFlowPage: setSelectedFlowPageIfAvailable,
  }
}