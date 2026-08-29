import axios from "axios";
import { useApiQuery, normalizeApiError } from "@/lib/shared/tanstackFunctions/api";
import { queryKeys } from "@/lib/shared/tanstackFunctions/queryKeys"; 
import type { TimeseriesResponse, TimeseriesParams } from "@/lib/shared/types/analytics";
import type { ApiError } from "@/lib/shared/types/api";


async function fetchTimeseries(params: TimeseriesParams): Promise<TimeseriesResponse> {
  const { domainId, from, to, interval, timezone } = params;

  const { data } = await axios.get<TimeseriesResponse>("/api/analytics/timeseries", {
    params: { domainId, from, to, interval, timezone },
    timeout: 10_000,
  });

  return data;
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

export type { TimeseriesPoint, TimeseriesResponse, TimeseriesParams, Interval } from "@/lib/shared/types/analytics";
export type { ApiError } from "@/lib/shared/types/api";