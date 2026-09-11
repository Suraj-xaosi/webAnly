import { useQueryClient } from "@tanstack/react-query";
import { useDimensionTimeseries } from "../analytics/useDimTimeseries";
import { useRealtimeContext } from "@/components/wrapper/RealtimeProvider";
import { useRealtimeMerge } from "./useRealtimeMerge";
import { getHourBucketLabel, mergeHourlyPoint } from "./timeseriesUtils";
import type { WebSocketMessage } from "@/lib/shared/types/realtime";
import type { Dimension, DimensionTimeseriesResponse } from "@/lib/shared/types/analytics";

export interface RealtimeDimensionTimeseriesResult {
  data: DimensionTimeseriesResponse["data"];
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
}

export function useRealtimeDimensionTimeseries(
  dimension: Dimension,
  value: string,
  domainId: string,
  from: string,
  to: string,
  enabled: boolean,
  timezone: string = "UTC"
): RealtimeDimensionTimeseriesResult {
  const restQuery = useDimensionTimeseries({ domainId, from, to, dimension, value, interval: "hour", timezone });
  const queryClient = useQueryClient();
  const { subscribe } = useRealtimeContext();
  const queryKey = ["dimension-timeseries", domainId, dimension, value, from, to, "hour", timezone];

  useRealtimeMerge<DimensionTimeseriesResponse>({
    enabled,
    queryClient,
    queryKey,
    subscribe,
    merge: (previous, message) => mergeWebSocketEvent(previous, message, dimension, value, timezone),
  });

  return {
    data: restQuery.data?.data ?? [],
    isLoading: !enabled || (restQuery.isLoading && restQuery.data === undefined),
    isError: restQuery.isError,
    error: restQuery.error,
  };
}

function mergeWebSocketEvent(
  previous: DimensionTimeseriesResponse | undefined,
  message: WebSocketMessage,
  dimension: Dimension,
  value: string,
  timezone: string
): DimensionTimeseriesResponse | undefined {
  if (message.type !== "new_event" || !message.data) return previous;

  const eventData = message.data as Record<string, unknown>;

  const eventValue = eventData[dimension];
  if (eventValue == null || String(eventValue) !== value) return previous;

  const eventTime = eventData.visitedAt ?? eventData.timestamp;
  const eventTimestamp = typeof eventTime === "string" || typeof eventTime === "number"
    ? String(eventTime)
    : new Date().toISOString();
  const label = getHourBucketLabel(eventTimestamp, timezone);
  const isNewVisitor = Boolean(eventData.isNewVisitor);

  return {
    dimension: previous?.dimension ?? dimension,
    value: previous?.value ?? value,
    interval: previous?.interval ?? "hour",
    from: previous?.from ?? "",
    to: previous?.to ?? "",
    timezone: previous?.timezone ?? timezone,
    data: mergeHourlyPoint(previous?.data ?? [], label, isNewVisitor),
  };
}