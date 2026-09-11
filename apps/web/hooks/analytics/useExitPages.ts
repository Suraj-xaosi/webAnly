import { fetchApiData, useApiQuery, normalizeApiError } from "@/lib/shared/tanstackFunctions/api";
import { queryKeys } from "@/lib/shared/tanstackFunctions/queryKeys"; 
import type { ExitPagesResponse, ExitPagesParams} from "@/lib/shared/types/analytics";
import type { ApiError } from "@/lib/shared/types/api";



async function fetchExitPages(params: ExitPagesParams): Promise<ExitPagesResponse> {
  const { domainId, from, to, limit = 100, timezone } = params;

  return fetchApiData<ExitPagesResponse>("/api/analytics/exit-pages", {
    domainId, from, to, limit, timezone,
  });
}

export function normalizeExitPagesError(error: unknown): ApiError {
  return normalizeApiError(error);
}

export function useExitPages(params: ExitPagesParams) {
  const { domainId, from, to, limit = 100, timezone } = params;

  return useApiQuery<ExitPagesResponse, ApiError>({
    queryKey: queryKeys.analytics.exitPages(domainId, from, to, limit, timezone),
    queryFn: () => fetchExitPages(params),
    enabled: Boolean(domainId && from && to),
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export type { ExitPagePoint, ExitPagesResponse, ExitPagesParams } from "@/lib/shared/types/analytics";
export type { ApiError } from "@/lib/shared/types/api";