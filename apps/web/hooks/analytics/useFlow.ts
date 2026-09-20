import { fetchApiData, useApiQuery, normalizeApiError } from "@/lib/shared/tanstackFunctions/api";
import { queryKeys } from "@/lib/shared/tanstackFunctions/queryKeys";
import type { FlowParams, FlowResponse } from "@/lib/shared/types/analytics";
import type { ApiError } from "@/lib/shared/types/api";

async function fetchFlow(params: FlowParams): Promise<FlowResponse> {
  const { domainId, page, from, to, timezone } = params;

  return fetchApiData<FlowResponse>("/api/analytics/flow", {
    domainId,
    page,
    from,
    to,
    timezone,
  });
}

export function normalizeFlowError(error: unknown): ApiError {
  return normalizeApiError(error);
}

export function useFlow(params: FlowParams) {
  const { domainId, page, from, to, timezone } = params;

  return useApiQuery<FlowResponse, ApiError>({
    queryKey: queryKeys.analytics.flow(domainId, page, from, to, timezone),
    queryFn: () => fetchFlow(params),
    enabled: Boolean(domainId && page && from && to),
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export type { FlowEntry, FlowParams, FlowResponse } from "@/lib/shared/types/analytics";
export type { ApiError } from "@/lib/shared/types/api";
