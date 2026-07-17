// hooks/useRealtimeTimeseries.ts
import { useEffect, useRef, useState } from "react";
import { useTimeseries, type TimeseriesPoint, type ApiError } from "./useTimeseries";
import { useWebSocket, type WebSocketMessage } from "./useWebSocket";
import { checkVisitor } from "../lib/Actions/checkVisitor";

export interface RealtimeTimeseriesResult {
  data: TimeseriesPoint[];
  isLoading: boolean;
  isError: boolean;
  error?: ApiError | null;
  isLive: boolean;
}

export function useRealtimeTimeseries(
  domainId: string,
  from: string,
  to: string,
  apikey: string,
  enabled: boolean,
  timezone?: string
): RealtimeTimeseriesResult {
  const restQuery = useTimeseries({ domainId, from, to, interval: "hour", timezone });

  const [timeseriesData, setTimeseriesData] = useState<TimeseriesPoint[]>([]);
  const [isLive, setIsLive] = useState(false);

  const seenVisitorsRef = useRef<Set<string>>(new Set());

  // Tracks which domain/date-range combo we've already seeded from REST.
  // Prevents a background refetch from wiping out live WebSocket-accumulated data.
  const seededKeyRef = useRef<string | null>(null);

  const { isConnected } = useWebSocket(domainId, apikey, (message: WebSocketMessage) => {
    if (!enabled) return;
    handleWebSocketMessage(message, domainId, seenVisitorsRef, setTimeseriesData);
  });

  useEffect(() => {
    if (!enabled || !restQuery.data?.data) return;

    // Same placeholderData concern as useRealtimeDimension: wait for the real
    // data for the current domain/date-range before marking it as seeded.
    if (restQuery.isPlaceholderData) return;

    const seedKey = `${domainId}:${from}:${to}`;
    if (seededKeyRef.current === seedKey) return; // already seeded this combo — don't reset live data
    seededKeyRef.current = seedKey;

    setTimeseriesData(restQuery.data.data);

    // New domain/date-range means old dedupe state is meaningless — reset it.
    seenVisitorsRef.current = new Set();
  }, [restQuery.data, restQuery.isPlaceholderData, enabled, domainId, from, to]);

  // isLive tracks the socket connection only — independent of REST fetch timing.
  useEffect(() => {
    setIsLive(isConnected);
  }, [isConnected]);

  return {
    data: timeseriesData,
    isLoading: !enabled || (restQuery.isLoading && timeseriesData.length === 0),
    isError: restQuery.isError,
    error: restQuery.error,
    isLive,
  };
}

function getBucketKey(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toISOString().substring(0, 13) + ":00:00.000Z";
}

async function handleWebSocketMessage(
  message: WebSocketMessage,
  domainId: string,
  seenVisitorsRef: React.RefObject<Set<string>>,
  setTimeseriesData: (updater: (prev: TimeseriesPoint[]) => TimeseriesPoint[]) => void
) {
  if (message.type !== "new_event" || !message.data) return;

  const eventData      = message.data;
  const eventTimestamp = eventData.visitedAt || eventData.timestamp || new Date().toISOString();
  const bucketKey      = getBucketKey(eventTimestamp);
  const visitorId      = eventData.visitorId as string;

  let isNewVisitor = false;

  if (visitorId) {
    if (seenVisitorsRef.current.has(visitorId)) {
      isNewVisitor = false;
    } else {
      const seenInDb = await checkVisitor(domainId, visitorId);
      seenVisitorsRef.current.add(visitorId);
      isNewVisitor = !seenInDb;
    }
  }

  setTimeseriesData((prev) => {
    const newData     = [...prev];
    const existingIdx = newData.findIndex((p) => p.date === bucketKey);

    if (existingIdx !== -1) {
      const existing = newData[existingIdx]!;
      newData[existingIdx] = {
        date:     existing.date,
        views:    existing.views + 1,
        visitors: existing.visitors + (isNewVisitor ? 1 : 0),
      };
    } else {
      newData.push({
        date:     bucketKey,
        views:    1,
        visitors: isNewVisitor ? 1 : 0,
      });
    }

    return newData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });
}