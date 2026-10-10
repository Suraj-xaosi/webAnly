import { useCallback, useMemo, useState } from "react"
import { useDimension, type Dimension } from "./useDimension"
import { useExitPages } from "./useExitPages"
import { useFlow } from "./useFlow"
import { useTimeseries } from "./useTimeseries"
import { useAllPageMap } from "./useAllPageMap"
import { ALL_PAGE_MAP_VALUE } from "@repo/types/analytics"

const DIMENSIONS: Dimension[] = [
  "browser",
  "country",
  "city",
  "device",
  "os",
  "referrer",
  "page",
]

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
  const browser = useDimension({
    domainId,
    from,
    to,
    dimension: "browser",
    timezone,
  })
  const country = useDimension({
    domainId,
    from,
    to,
    dimension: "country",
    timezone,
  })
  const city = useDimension({ domainId, from, to, dimension: "city", timezone })
  const device = useDimension({
    domainId,
    from,
    to,
    dimension: "device",
    timezone,
  })
  const os = useDimension({ domainId, from, to, dimension: "os", timezone })
  const referrer = useDimension({
    domainId,
    from,
    to,
    dimension: "referrer",
    timezone,
  })
  const page = useDimension({ domainId, from, to, dimension: "page", timezone })
  const exitPages = useExitPages({ domainId, from, to, timezone })
  const flowPages = useMemo(
    () =>
      page.data?.data
        .map((item) => item.name)
        .filter((name) => name.trim().length > 0) ?? [],
    [page.data]
  )
  const [selectedFlowPage, setSelectedFlowPage] =
    useState<string>(ALL_PAGE_MAP_VALUE)
  const pagesAreLoading = page.isFetching
  const isAllPageMap = selectedFlowPage === ALL_PAGE_MAP_VALUE
  const activeFlowPage = isAllPageMap
    ? ALL_PAGE_MAP_VALUE
    : !pagesAreLoading && flowPages.includes(selectedFlowPage)
      ? selectedFlowPage
      : !pagesAreLoading
        ? (flowPages[0] ?? "")
        : ""
  const pageFlow = useFlow({
    domainId,
    page: isAllPageMap ? "" : activeFlowPage,
    from,
    to,
    timezone,
  })
  const allPageMap = useAllPageMap(
    { domainId, from, to, timezone },
    isAllPageMap
  )

  const dimensionMap = { browser, country, city, device, os, referrer, page }
  const setSelectedFlowPageIfAvailable = useCallback(
    (nextPage: string) => {
      if (nextPage === ALL_PAGE_MAP_VALUE || flowPages.includes(nextPage)) {
        setSelectedFlowPage(nextPage)
      }
    },
    [flowPages]
  )

  return {
    timeseries,
    exitPages,
    dimensionMap,
    dimensions: DIMENSIONS,
    flowPages,
    activeFlowPage,
    pageFlow,
    allPageMap,
    isAllPageMap,
    pagesAreLoading,
    pagesError: page.error,
    isPagesError: page.isError,
    setSelectedFlowPage: setSelectedFlowPageIfAvailable,
  }
}
