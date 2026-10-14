import { useQueryClient } from "@tanstack/react-query";
import { useTimeseries } from "../analytics/useTimeseries";
import { useRealtimeContext } from "@/components/wrapper/RealtimeProvider";
import { useRealtimeMerge } from "./useRealtimeMerge";
import { getHourBucketLabel, mergeHourlyPoint } from "./timeseriesUtils";
import type { RealtimeTimeseriesResult, WebSocketMessage } from "@repo/types/realtime";
import type { TimeseriesResponse} from "@repo/types/analytics"



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
    merge: (previous, message) =>
      mergeWebSocketEvent(previous, message, from, to, timezone),
  });

  return {
    data: restQuery.data?.data ?? [],
    summary: restQuery.data?.summary,
    isLoading: !enabled || (restQuery.isLoading && restQuery.data === undefined),
    isError: restQuery.isError,
    error: restQuery.error,
    isLive: isConnected,
  };
}

function mergeWebSocketEvent(
  previous: TimeseriesResponse | undefined,
  message: WebSocketMessage,
  from: string,
  to: string,
  timezone: string
): TimeseriesResponse | undefined {
  if (message.type !== "new_event" || !message.data) return;

  const eventData = message.data;
  const eventTimestamp = eventData.visitedAt || eventData.timestamp || new Date().toISOString();
  const parsedTimestamp = new Date(eventTimestamp);
  if (Number.isNaN(parsedTimestamp.getTime())) return previous;
  const eventDate = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(
    parsedTimestamp
  );
  if (eventDate < from || eventDate > to) return;

  const label = getHourBucketLabel(eventTimestamp, timezone);

  const isNewVisitor = Boolean(eventData.isNewVisitor);
  const summary = previous?.summary
    ? {
        views: previous.summary.views + 1,
        visitors:
          previous.summary.visitors +
          (from === to && eventData.isNewVisitorToday === true ? 1 : 0),
        exits:
          previous.summary.exits + (eventData.exitType === "pagehide" ? 1 : 0),
      }
    : undefined;

  return {
    interval: previous?.interval ?? "hour",
    from: previous?.from ?? from,
    to: previous?.to ?? to,
    timezone: previous?.timezone ?? timezone,
    summary,
    data: mergeHourlyPoint(previous?.data ?? [], label, isNewVisitor, true),
  };
}
