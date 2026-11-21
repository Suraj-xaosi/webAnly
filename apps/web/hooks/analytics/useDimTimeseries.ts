import { fetchApiData, useApiQuery, normalizeApiError } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { DimensionTimeseriesResponse, DimensionTimeseriesParams } from "@/types/analytics";
import type { ApiError } from "@/types/api";

async function fetchDimensionTimeseries(
  params: DimensionTimeseriesParams
): Promise<DimensionTimeseriesResponse> {
  const { domainId, from, to, dimension, value, interval = "hour", timezone } = params;

  return fetchApiData<DimensionTimeseriesResponse>("/api/analytics/dimension-timeseries", {
    domainId, from, to, dimension, value, interval, timezone,
  });
}

export function normalizeDimensionTimeseriesError(error: unknown): ApiError {
  return normalizeApiError(error);
}

export function useDimensionTimeseries(params: DimensionTimeseriesParams) {
  const { domainId, from, to, dimension, value, interval = "hour", timezone } = params;

  return useApiQuery<DimensionTimeseriesResponse, ApiError>({
    queryKey: queryKeys.analytics.dimensionTimeseries(domainId, dimension, value, from, to, interval, timezone),
    queryFn: () => fetchDimensionTimeseries(params),
    enabled: Boolean(domainId && from && to && dimension && value),
    staleTime: 60 * 1000,     // 1 min — popup reopen within this window = no refetch
    gcTime: 5 * 60 * 1000,    // 5 min cache retained after popup closes
  });
}

export type { DimensionTimeseriesResponse, DimensionTimeseriesParams } from "@/types/analytics";
export type { ApiError } from "@/types/api";