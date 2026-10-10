import { fetchApiData, useApiQuery } from "@/lib/shared/tanstackFunctions/api"
import { queryKeys } from "@/lib/shared/tanstackFunctions/queryKeys"
import {
  ALL_PAGE_MAP_VALUE,
  type PageMapResponse,
} from "@repo/types/analytics"
import type { ApiError } from "@repo/types/api"

interface PageMapParams {
  domainId: string
  from: string
  to: string
  timezone?: string
}

async function fetchPageMap(params: PageMapParams): Promise<PageMapResponse> {
  return fetchApiData<PageMapResponse>("/api/analytics/flow", {
    domainId: params.domainId,
    page: ALL_PAGE_MAP_VALUE,
    from: params.from,
    to: params.to,
    timezone: params.timezone,
  })
}

export function useAllPageMap(params: PageMapParams, enabled: boolean) {
  const { domainId, from, to, timezone } = params

  return useApiQuery<PageMapResponse, ApiError>({
    queryKey: queryKeys.analytics.allPageMap(domainId, from, to, timezone),
    queryFn: () => fetchPageMap(params),
    enabled: enabled && Boolean(domainId && from && to),
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
