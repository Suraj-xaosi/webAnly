import { useCallback, useMemo, useState } from "react"
import type { Dimension } from "./useDimension"
import { useDimensions } from "./useDimensions"
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
  const dimensionQuery = useDimensions({ domainId, from, to, timezone })
  const dimensionResult = (dimension: Dimension) => ({
    data: dimensionQuery.data?.[dimension],
    isLoading: dimensionQuery.isLoading,
    isError: dimensionQuery.isError,
    error: dimensionQuery.error,
    refetch: dimensionQuery.refetch,
  })
  const dimensionMap = {
    browser: dimensionResult("browser"),
    country: dimensionResult("country"),
    city: dimensionResult("city"),
    device: dimensionResult("device"),
    os: dimensionResult("os"),
    referrer: dimensionResult("referrer"),
    page: dimensionResult("page"),
  }
  const exitPages = useExitPages({ domainId, from, to, timezone })
  const flowPages = useMemo(
    () =>
      dimensionMap.page.data?.data
        .map((item) => item.name)
        .filter((name) => name.trim().length > 0) ?? [],
    [dimensionMap.page.data]
  )
  const [selectedFlowPage, setSelectedFlowPage] =
    useState<string>(ALL_PAGE_MAP_VALUE)
  const pagesAreLoading = dimensionQuery.isFetching
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
    pagesError: dimensionQuery.error,
    isPagesError: dimensionQuery.isError,
    setSelectedFlowPage: setSelectedFlowPageIfAvailable,
  }
}
