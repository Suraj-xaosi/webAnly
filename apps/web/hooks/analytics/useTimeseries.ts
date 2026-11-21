import { fetchApiData, useApiQuery, normalizeApiError } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { TimeseriesResponse, TimeseriesParams } from "@/types/analytics";
import type { ApiError } from "@/types/api";


async function fetchTimeseries(params: TimeseriesParams): Promise<TimeseriesResponse> {
  const { domainId, from, to, interval, timezone } = params;

  return fetchApiData<TimeseriesResponse>("/api/analytics/timeseries", {
    domainId, from, to, interval, timezone,
  });
}

export function useTimeseries(params: TimeseriesParams) {
  const { domainId, from, to, interval = "hour", timezone } = params;

  return useApiQuery<TimeseriesResponse, ApiError>({
    queryKey: queryKeys.analytics.timeseries(domainId, from, to, interval, timezone),
    queryFn: () => fetchTimeseries(params),
    enabled: Boolean(domainId && from && to),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    throwOnError: false,
    select: (data) => data,
  });
}

export async function prefetchTimeseries(
  queryClient: import("@tanstack/react-query").QueryClient,
  params: TimeseriesParams
) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.analytics.timeseries(
      params.domainId,
      params.from,
      params.to,
      params.interval ?? "hour",
      params.timezone
    ),
    queryFn: () => fetchTimeseries(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function normalizeAxiosError(error: unknown): ApiError {
  return normalizeApiError(error);
}

export type { TimeseriesPoint, TimeseriesResponse, TimeseriesSummary, TimeseriesParams, Interval } from "@/types/analytics";
export type { ApiError } from "@/types/api";