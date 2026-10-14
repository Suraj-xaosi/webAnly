import { useQueryClient } from "@tanstack/react-query";
import { ANALYTICS_DIMENSIONS, type Dimension, type DimensionsResponse } from "@repo/types/analytics";
import type { RealtimeDimensionResult, WebSocketMessage } from "@repo/types/realtime";
import { useDimensions } from "@/hooks/analytics/useDimensions";
import { queryKeys } from "@/lib/shared/tanstackFunctions/queryKeys";
import { useRealtimeContext } from "@/components/wrapper/RealtimeProvider";
import { useRealtimeMerge } from "./useRealtimeMerge";
import { mergeDimensionWebSocketEvent } from "./useRealtimeDimension";

export function useRealtimeDimensions(
  domainId: string,
  from: string,
  to: string,
  enabled: boolean,
  timezone?: string
): Record<Dimension, RealtimeDimensionResult> {
  const restQuery = useDimensions({ domainId, from, to, timezone });
  const queryClient = useQueryClient();
  const { subscribe, isConnected } = useRealtimeContext();
  const queryKey = queryKeys.analytics.dimensions(domainId, from, to, timezone);

  useRealtimeMerge<DimensionsResponse>({
    enabled,
    queryClient,
    queryKey,
    subscribe,
    merge: (previous, message) =>
      mergeRealtimeDimensions(previous, message, from, to, timezone ?? "UTC"),
  });

  const resultForDimension = (
    dimension: Dimension
  ): RealtimeDimensionResult => ({
    data: restQuery.data?.[dimension]?.data ?? [],
    isLoading: !enabled || (restQuery.isLoading && restQuery.data === undefined),
    isError: restQuery.isError,
    error: restQuery.error,
    isLive: isConnected,
  });

  return {
    browser: resultForDimension("browser"),
    country: resultForDimension("country"),
    city: resultForDimension("city"),
    device: resultForDimension("device"),
    os: resultForDimension("os"),
    referrer: resultForDimension("referrer"),
    page: resultForDimension("page"),
  };
}

function mergeRealtimeDimensions(
  previous: DimensionsResponse | undefined,
  message: WebSocketMessage,
  from: string,
  to: string,
  timezone: string
): DimensionsResponse | undefined {
  if (!previous) return previous;

  const next = { ...previous };
  for (const dimension of ANALYTICS_DIMENSIONS) {
    next[dimension] =
      mergeDimensionWebSocketEvent(
        previous[dimension],
        message,
        dimension,
        from,
        to,
        timezone
      ) ??
      previous[dimension];
  }

  return next;
}
