import { useQueryClient } from "@tanstack/react-query";
import {
  ANALYTICS_DIMENSIONS,
  type Dimension,
  type DimensionPoint,
  type DimensionResponse,
  type DimensionsResponse,
} from "@repo/types/analytics";
import type { RealtimeDimensionResult, WebSocketMessage } from "@repo/types/realtime";
import { useDimensions } from "@/hooks/analytics/useDimensions";
import { queryKeys } from "@/lib/shared/tanstackFunctions/queryKeys";
import { useRealtimeContext } from "@/components/wrapper/RealtimeProvider";
import { useRealtimeMerge } from "./useRealtimeMerge";

interface RealtimeDimensionEvent {
  visitedAt?: string | number;
  timestamp?: string | number;
  timeSpent?: number;
  isNewVisitorFor?: Partial<Record<Dimension, boolean>>;
  [key: string]: unknown;
}

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

function getDimensionValue(
  eventData: RealtimeDimensionEvent,
  dimension: Dimension
): string {
  const value = eventData[dimension];
  if (dimension === "referrer" && eventData.referrer == null) return "null";
  return value == null ? "Unknown" : String(value);
}

function mergeDimensionWebSocketEvent(
  previous: DimensionResponse | undefined,
  message: WebSocketMessage,
  dimension: Dimension,
  from: string,
  to: string,
  timezone: string
): DimensionResponse | undefined {
  if (message.type !== "new_event" || !message.data) return;

  const eventData = message.data as RealtimeDimensionEvent;
  const eventTimestamp = eventData.visitedAt || eventData.timestamp;
  if (!eventTimestamp) return previous;

  const parsedTimestamp = new Date(eventTimestamp);
  if (Number.isNaN(parsedTimestamp.getTime())) return previous;

  const eventDate = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(
    parsedTimestamp
  );
  if (eventDate < from || eventDate > to) return previous;

  const dimensionKey = getDimensionValue(eventData, dimension);
  if (!dimensionKey || dimensionKey === "null") return;

  const shouldCountVisitor =
    eventData.isNewVisitorFor?.[dimension] === true;
  const timeSpent =
    typeof eventData.timeSpent === "number" ? eventData.timeSpent : 0;
  const data = previous?.data ?? [];
  const existing = data.find((point) => point.name === dimensionKey);

  if (existing) {
    const totalViews = existing.views + 1;
    const totalVisitors = existing.visitors + (shouldCountVisitor ? 1 : 0);
    const updatedPoint: DimensionPoint = {
      ...existing,
      views: totalViews,
      visitors: totalVisitors,
      avgDwell: Math.round(
        (existing.avgDwell * existing.views + timeSpent) / totalViews
      ),
      viewsPerVisitor: +(totalViews / Math.max(totalVisitors, 1)).toFixed(2),
    };

    return {
      dimension: previous?.dimension ?? dimension,
      from: previous?.from ?? from,
      to: previous?.to ?? to,
      total: previous?.total ?? data.length,
      timezone: previous?.timezone ?? timezone,
      data: data.map((point) =>
        point.name === dimensionKey ? updatedPoint : point
      ),
    };
  }

  return {
    dimension: previous?.dimension ?? dimension,
    from: previous?.from ?? from,
    to: previous?.to ?? to,
    total: (previous?.total ?? data.length) + 1,
    timezone: previous?.timezone ?? timezone,
    data: [
      ...data,
      {
        name: dimensionKey,
        views: 1,
        visitors: shouldCountVisitor ? 1 : 0,
        avgDwell: timeSpent,
        viewsPerVisitor: 1,
      },
    ],
  };
}
