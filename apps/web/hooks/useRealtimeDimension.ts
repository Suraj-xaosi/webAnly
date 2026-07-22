// hooks/useRealtimeDimension.ts
import { useEffect, useRef, useState } from "react";
import { useDimension, type Dimension, type DimensionPoint, type ApiError } from "./useDimension";
import { useWebSocket, type WebSocketMessage } from "./useWebSocket";

export interface RealtimeDimensionResult {
  data: DimensionPoint[];
  isLoading: boolean;
  isError: boolean;
  error?: ApiError | null;
  isLive: boolean;
}

export function useRealtimeDimension(
  dimension: Dimension,
  domainId: string,
  from: string,
  to: string,
  apikey: string,
  enabled: boolean,
  timezone?: string,
  limit?: number
): RealtimeDimensionResult {
  const restQuery = useDimension({ domainId, from, to, dimension, limit, timezone });

  const [dimensionMap, setDimensionMap] = useState<Map<string, DimensionPoint>>(new Map());
  const [isLive, setIsLive] = useState(false);

  // Tracks which domain/date-range/dimension combo we've already seeded from REST.
  // Prevents a background refetch (tab refocus, refetch interval, etc.) from
  // wiping out live WebSocket-accumulated counts.
  const seededKeyRef = useRef<string | null>(null);

  const { isConnected } = useWebSocket(domainId, apikey, (message: WebSocketMessage) => {
    if (!enabled) return;
    handleWebSocketMessage(message, dimension, setDimensionMap);
  });

  useEffect(() => {
    if (!enabled || !restQuery.data?.data) return;

    // restQuery.isPlaceholderData is true while React Query is still showing
    // the PREVIOUS query's data (because of placeholderData: (prev) => prev
    // in useDimension) while the real data for the current params is still
    // in flight. If we don't wait for this to clear, switching domains/date
    // ranges would seed the map with the old domain's numbers and then skip
    // the real data when it arrives, since the key would already be marked
    // "seeded".
    if (restQuery.isPlaceholderData) return;

    const seedKey = `${domainId}:${from}:${to}:${dimension}`;
    if (seededKeyRef.current === seedKey) return; // already seeded this exact combo — don't reset live data
    seededKeyRef.current = seedKey;

    const newMap = new Map<string, DimensionPoint>(
      restQuery.data.data.map((point) => [point.name, point])
    );
    setDimensionMap(newMap);
  }, [restQuery.data, restQuery.isPlaceholderData, enabled, domainId, from, to, dimension]);

  // isLive tracks the socket connection only — independent of REST fetch timing.
  useEffect(() => {
    setIsLive(isConnected);
  }, [isConnected]);

  const dataArray = Array.from(dimensionMap.values()).sort((a, b) => b.views - a.views);

  return {
    data: dataArray,
    isLoading: !enabled || (restQuery.isLoading && dimensionMap.size === 0),
    isError: restQuery.isError,
    error: restQuery.error,
    isLive,
  };
}

function getDimensionValue(eventData: Record<string, any>, dimension: Dimension): string | null {
  const value = eventData[dimension];
  return value && value !== "Unknown" ? String(value) : null;
}

async function handleWebSocketMessage(
  message: WebSocketMessage,
  dimension: Dimension,
  setDimensionMap: (updater: (prev: Map<string, DimensionPoint>) => Map<string, DimensionPoint>) => void
) {
  if (message.type !== "new_event" || !message.data) return;

  const eventData = message.data as Record<string, any>;
  const dimensionKey = getDimensionValue(eventData, dimension);
  if (!dimensionKey) return;

  const shouldCountVisitor =
    typeof eventData.isNewVisitorFor?.[dimension] === "boolean"
      ? eventData.isNewVisitorFor[dimension]
      : false;

  setDimensionMap((prev) => {
    const newMap = new Map(prev);
    const existing = newMap.get(dimensionKey);

    if (existing) {
      const totalViews = existing.views + 1;
      const totalVisitors = existing.visitors + (shouldCountVisitor ? 1 : 0);

      newMap.set(dimensionKey, {
        ...existing,
        views: totalViews,
        visitors: totalVisitors,
        avgDwell: Math.round(
          (existing.avgDwell * existing.views + (eventData.timeSpent || 0)) / totalViews
        ),
        viewsPerVisitor: +(totalViews / Math.max(totalVisitors, 1)).toFixed(2),
      });
    } else {
      newMap.set(dimensionKey, {
        name: dimensionKey,
        views: 1,
        visitors: shouldCountVisitor ? 1 : 0,
        avgDwell: eventData.timeSpent || 0,
        viewsPerVisitor: 1,
      });
    }

    return newMap;
  });
}