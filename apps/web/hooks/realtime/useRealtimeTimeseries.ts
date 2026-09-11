import { useQueryClient } from "@tanstack/react-query";
import { useTimeseries } from "../analytics/useTimeseries";
import { useRealtimeContext } from "@/components/wrapper/RealtimeProvider";
import { useRealtimeMerge } from "./useRealtimeMerge";
import { getHourBucketLabel, mergeHourlyPoint } from "./timeseriesUtils";
import type { RealtimeTimeseriesResult, WebSocketMessage } from "@/lib/shared/types/realtime";
import type { TimeseriesResponse} from "@/lib/shared/types/analytics"



export function useRealtimeTimeseries(
  domainId: string,
  from: string,
  to: string,
  apikey: string,
  enabled: boolean,
  timezone: string = "UTC"
): RealtimeTimeseriesResult {
  const restQuery = useTimeseries({ domainId, from, to, interval: "hour", timezone });
  const queryClient = useQueryClient();
  const { subscribe, isConnected } = useRealtimeContext();
  const queryKey = ["timeseries", domainId, from, to, "hour", timezone];

  useRealtimeMerge<TimeseriesResponse>({
    enabled,
    queryClient,
    queryKey,
    subscribe,
    merge: (previous, message) => mergeWebSocketEvent(previous, message, timezone),
  });

  return {
    data: restQuery.data?.data ?? [],
    isLoading: !enabled || (restQuery.isLoading && restQuery.data === undefined),
    isError: restQuery.isError,
    error: restQuery.error,
    isLive: isConnected,
  };
}

function mergeWebSocketEvent(
  previous: TimeseriesResponse | undefined,
  message: WebSocketMessage,
  timezone: string
): TimeseriesResponse | undefined {
  if (message.type !== "new_event" || !message.data) return;

  const eventData = message.data;
  const eventTimestamp = eventData.visitedAt || eventData.timestamp || new Date().toISOString();
  const label = getHourBucketLabel(eventTimestamp, timezone);

  const isNewVisitor = Boolean(eventData.isNewVisitor);

    return {
      interval: previous?.interval ?? "hour",
      from: previous?.from ?? "",
      to: previous?.to ?? "",
      data: mergeHourlyPoint(previous?.data ?? [], label, isNewVisitor, true),
    };
}
