import axios from "axios";
import { useApiQuery, normalizeApiError } from "@/lib/shared/tanstackFunctions/api";
import { queryKeys } from "@/lib/shared/tanstackFunctions/queryKeys"
import {Dimension, DimensionPoint, DimensionResponse, DimensionParams} from "@/lib/shared/types/analytics"; 
import type { ApiError } from "@/lib/shared/types/api";


async function fetchDimension(params: DimensionParams): Promise<DimensionResponse> {
  const { domainId, from, to, dimension, limit = 100, timezone } = params;

  const { data } = await axios.get<DimensionResponse>("/api/analytics/dimension", {
    params: { domainId, from, to, dimension, limit, timezone },
    timeout: 10_000,
  });

  return data;
}

export function normalizeDimensionError(error: unknown): ApiError {
  return normalizeApiError(error);
}

export function useDimension(params: DimensionParams) {
  const { domainId, from, to, dimension, limit = 100, timezone } = params;

  return useApiQuery<DimensionResponse, ApiError>({
    queryKey: queryKeys.analytics.dimension(domainId, from, to, dimension, limit, timezone),
    queryFn: () => fetchDimension(params),
    enabled: Boolean(domainId && from && to && dimension),
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export async function prefetchDimension(
  queryClient: import("@tanstack/react-query").QueryClient,
  params: DimensionParams
) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.analytics.dimension(
      params.domainId,
      params.from,
      params.to,
      params.dimension,
      params.limit ?? 100,
      params.timezone
    ),
    queryFn: () => fetchDimension(params),
    staleTime: 3 * 60 * 1000,
  });
}
