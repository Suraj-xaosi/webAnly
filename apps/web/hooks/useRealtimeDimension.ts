// hooks/useRealtimeDimension.ts
import { useEffect, useRef, useState } from "react";
import { useDimension, type Dimension, type DimensionPoint, type ApiError } from "./useDimension";
import { useWebSocket, type WebSocketMessage } from "./useWebSocket";
import { checkVisitor } from "../lib/Actions/checkVisitor";

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

  const seenVisitorsRef = useRef<Map<string, Set<string>>>(new Map());

  // Tracks which domain/date-range/dimension combo we've already seeded from REST.
  // Prevents a background refetch (tab refocus, refetch interval, etc.) from
  // wiping out live WebSocket-accumulated counts.
  const seededKeyRef = useRef<string | null>(null);

  const { isConnected } = useWebSocket(domainId, apikey, (message: WebSocketMessage) => {
    if (!enabled) return;
    handleWebSocketMessage(
      message,
      dimension,
      domainId,
      seenVisitorsRef,
      setDimensionMap
    );
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

    // New domain/date-range means old dedupe state is meaningless — reset it.
    seenVisitorsRef.current = new Map();
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
  domainId: string,
  seenVisitorsRef: React.RefObject<Map<string, Set<string>>>,
  setDimensionMap: (updater: (prev: Map<string, DimensionPoint>) => Map<string, DimensionPoint>) => void
) {
  if (message.type !== "new_event" || !message.data) return;

  const eventData    = message.data;
  const dimensionKey = getDimensionValue(eventData, dimension);
  if (!dimensionKey) return;

  const visitorId = eventData.visitorId as string;

  if (!seenVisitorsRef.current.has(dimensionKey)) {
    seenVisitorsRef.current.set(dimensionKey, new Set());
  }
  const seenSet = seenVisitorsRef.current.get(dimensionKey)!;

  let isNewVisitor = false;

  if (visitorId) {
    if (seenSet.has(visitorId)) {
      isNewVisitor = false;
    } else {
      seenSet.add(visitorId); // reserve immediately, before the await
      //const seenInDb = await checkVisitor(domainId, visitorId);
      isNewVisitor =  true; //!seenInDb;
    }
  }

  setDimensionMap((prev) => {
    const newMap   = new Map(prev);
    const existing = newMap.get(dimensionKey);

    if (existing) {
      const totalViews    = existing.views + 1;
      const totalVisitors = existing.visitors + (isNewVisitor ? 1 : 0);

      newMap.set(dimensionKey, {
        ...existing,
        views:           totalViews,
        visitors:        totalVisitors,
        avgDwell:        Math.round(
          (existing.avgDwell * existing.views + (eventData.timeSpent || 0)) / totalViews
        ),
        viewsPerVisitor: +(totalViews / Math.max(totalVisitors, 1)).toFixed(2),
      });
    } else {
      newMap.set(dimensionKey, {
        name:            dimensionKey,
        views:           1,
        visitors:        isNewVisitor ? 1 : 0,
        avgDwell:        eventData.timeSpent || 0,
        viewsPerVisitor: 1,
      });
    }

    return newMap;
  });
}