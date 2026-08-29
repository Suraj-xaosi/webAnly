// hooks/useRealtimeDimension.ts
import { useQueryClient } from "@tanstack/react-query";
import { useDimension } from "../analytics/useDimension";
import { useRealtimeContext } from "@/components/wrapper/RealtimeProvider";
import { useRealtimeMerge } from "./useRealtimeMerge";
import type { RealtimeDimensionResult, WebSocketMessage } from "@/lib/shared/types/realtime";
import type { Dimension, DimensionResponse} from "@/lib/shared/types/analytics"


export function useRealtimeDimension(
  dimension: Dimension,
  domainId: string,
  from: string,
  to: string,
  apikey: string,
  enabled: boolean,
  timezone?: string,
  limit?: number,
  
  
): RealtimeDimensionResult {
  const restQuery = useDimension({ domainId, from, to, dimension, limit, timezone });
  const queryClient = useQueryClient();
  const { subscribe, isConnected } = useRealtimeContext();
  const queryKey = ["dimension", domainId, from, to, dimension, limit ?? 100, timezone];

  useRealtimeMerge<DimensionResponse>({
    enabled,
    queryClient,
    queryKey,
    subscribe,
    merge: (previous, message) => mergeWebSocketEvent(previous, message, dimension),
  });

  return {
    data: restQuery.data?.data ?? [],
    isLoading: !enabled || (restQuery.isLoading && restQuery.data === undefined),
    isError: restQuery.isError,
    error: restQuery.error,
    isLive: isConnected,
  };
}

function getDimensionValue(eventData: Record<string, any>, dimension: Dimension): string  {
  const value = eventData[dimension];
  return value == null ? "Unknown" : String(value);
}

function mergeWebSocketEvent(
  previous: DimensionResponse | undefined,
  message: WebSocketMessage,
  dimension: Dimension
): DimensionResponse | undefined {
  if (message.type !== "new_event" || !message.data) return;

  const eventData = message.data as Record<string, any>;
  const dimensionKey = getDimensionValue(eventData, dimension);
  //if (!dimensionKey) return;

  const shouldCountVisitor =
    typeof eventData.isNewVisitorFor?.[dimension] === "boolean"
      ? eventData.isNewVisitorFor[dimension]
      : false;

  const data = previous?.data ?? [];
    const existing = data.find((point) => point.name === dimensionKey);

    if (existing) {
      const totalViews = existing.views + 1;
      const totalVisitors = existing.visitors + (shouldCountVisitor ? 1 : 0);
      const updatedPoint = {
        ...existing,
        views: totalViews,
        visitors: totalVisitors,
        avgDwell: Math.round(
          (existing.avgDwell * existing.views + (eventData.timeSpent || 0)) / totalViews
        ),
        viewsPerVisitor: +(totalViews / Math.max(totalVisitors, 1)).toFixed(2),
      };

      return {
        dimension: previous?.dimension ?? dimension,
        from: previous?.from ?? "",
        to: previous?.to ?? "",
        total: previous?.total ?? data.length,
        data: data.map((point) => (point.name === dimensionKey ? updatedPoint : point)),
      };
    }

    return {
      dimension: previous?.dimension ?? dimension,
      from: previous?.from ?? "",
      to: previous?.to ?? "",
      total: previous?.total ?? data.length + 1,
      data: [...data, {
        name: dimensionKey,
        views: 1,
        visitors: shouldCountVisitor ? 1 : 0,
        avgDwell: eventData.timeSpent || 0,
        viewsPerVisitor: 1,
      }],
    };
}