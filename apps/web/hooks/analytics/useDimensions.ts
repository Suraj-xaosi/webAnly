import { fetchApiData, useApiQuery } from "@/lib/shared/tanstackFunctions/api";
import { queryKeys } from "@/lib/shared/tanstackFunctions/queryKeys";
import type { ApiError } from "@repo/types/api";
import type { DimensionsResponse } from "@repo/types/analytics";

interface DimensionsParams {
  domainId: string;
  from: string;
  to: string;
  timezone?: string;
}

async function fetchDimensions(
  params: DimensionsParams
): Promise<DimensionsResponse> {
  return fetchApiData<DimensionsResponse>("/api/analytics/dimensions", {
    ...params,
  });
}

export function useDimensions(params: DimensionsParams) {
  const { domainId, from, to, timezone } = params;

  return useApiQuery<DimensionsResponse, ApiError>({
    queryKey: queryKeys.analytics.dimensions(domainId, from, to, timezone),
    queryFn: () => fetchDimensions(params),
    enabled: Boolean(domainId && from && to),
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
