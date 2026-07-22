// hooks/useRealtimeTimeseries.ts
import { useEffect, useRef, useState } from "react";
import { useTimeseries, type TimeseriesPoint, type ApiError } from "./useTimeseries";
import { useWebSocket, type WebSocketMessage } from "./useWebSocket";

export interface RealtimeTimeseriesResult {
  data: TimeseriesPoint[];
  isLoading: boolean;
  isError: boolean;
  error?: ApiError | null;
  isLive: boolean;
}

// Internal shape: same as TimeseriesPoint, plus a numeric hour for sorting.
// hour24 never leaves this hook — the returned `data` is structurally still
// TimeseriesPoint[], consumers don't see or need this field.
interface InternalPoint extends TimeseriesPoint {
  hour24: number;
}

export function useRealtimeTimeseries(
  domainId: string,
  from: string,
  to: string,
  apikey: string,
  enabled: boolean,
  timezone: string = "UTC"
): RealtimeTimeseriesResult {
  const restQuery = useTimeseries({ domainId, from, to, interval: "hour", timezone });

  const [timeseriesData, setTimeseriesData] = useState<InternalPoint[]>([]);
  const [isLive, setIsLive] = useState(false);

  // Tracks which domain/date-range combo we've already seeded from REST.
  // Prevents a background refetch from wiping out live WebSocket-accumulated data.
  const seededKeyRef = useRef<string | null>(null);

  const { isConnected } = useWebSocket(domainId, apikey, (message: WebSocketMessage) => {
    if (!enabled) return;
    handleWebSocketMessage(message, timezone, setTimeseriesData);
  });

  useEffect(() => {
    if (!enabled || !restQuery.data?.data) return;

    // Same placeholderData concern as useRealtimeDimension: wait for the real
    // data for the current domain/date-range before marking it as seeded.
    if (restQuery.isPlaceholderData) return;

    const seedKey = `${domainId}:${from}:${to}`;
    if (seededKeyRef.current === seedKey) return; // already seeded this combo — don't reset live data
    seededKeyRef.current = seedKey;

    // REST rows only carry {date, views, visitors} — backfill hour24 from the
    // label so seeded rows sort correctly alongside live WebSocket rows.
    const seeded: InternalPoint[] = restQuery.data.data.map((point) => ({
      ...point,
      hour24: parseHourLabel(point.date),
    }));

    setTimeseriesData(seeded);
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

// Converts a UTC timestamp into the given IANA timezone's local hour, and
// builds the same label format the API produces: "2pm", "12am", etc.
// (hour12, no leading zero, lowercase period, no space — matches the
// route.ts logic: `${hour12}${period}` from getUTCHours() after AT TIME ZONE.)
function getBucketKey(dateStr: string, timezone: string): { label: string; hour24: number } {
  const date = new Date(dateStr);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hourCycle: "h23",
    hour: "numeric",
  }).formatToParts(date);

  const hourPart = parts.find((p) => p.type === "hour");
  const hour24 = hourPart ? parseInt(hourPart.value, 10) : date.getUTCHours();

  const period = hour24 >= 12 ? "pm" : "am";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const label = `${hour12}${period}`;

  return { label, hour24 };
}

// Reverse of the API's label format — used only when seeding from REST,
// since REST rows arrive with a label but no raw hour number.
// "12am" -> 0, "1am" -> 1, "12pm" -> 12, "1pm" -> 13, "11pm" -> 23
function parseHourLabel(label: string): number {
  const period = label.slice(-2);
  const hour12 = parseInt(label, 10);

  if (period === "am") return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

function handleWebSocketMessage(
  message: WebSocketMessage,
  timezone: string,
  setTimeseriesData: (updater: (prev: InternalPoint[]) => InternalPoint[]) => void
) {
  if (message.type !== "new_event" || !message.data) return;

  // Debug: log incoming messages to help diagnose why views aren't updating
  try {
    // Keep logs lightweight and safe if message contains circular refs
    console.debug("[useRealtimeTimeseries] WS message type:", message.type);
    console.debug("[useRealtimeTimeseries] WS message data:", message.data);
  } catch (e) {
    /* ignore logging errors */
  }

  const eventData = message.data;
  const eventTimestamp = eventData.visitedAt || eventData.timestamp || new Date().toISOString();
  const { label, hour24 } = getBucketKey(eventTimestamp, timezone);

  const isNewVisitor = Boolean(eventData.isNewVisitor);

  setTimeseriesData((prev) => {
    const newData = [...prev];
    const existingIdx = newData.findIndex((p) => p.date === label);

    try {
      console.debug("[useRealtimeTimeseries] bucket update:", { label, hour24, isNewVisitor, existingIdx });
    } catch (e) {
      /* ignore logging errors */
    }

    if (existingIdx !== -1) {
      const existing = newData[existingIdx]!;
      newData[existingIdx] = {
        date: existing.date,
        hour24: existing.hour24,
        views: existing.views + 1,
        visitors: existing.visitors + (isNewVisitor ? 1 : 0),
      };
    } else {
      newData.push({
        date: label,
        hour24,
        views: 1,
        visitors: isNewVisitor ? 1 : 0,
      });
    }

    return newData.sort((a, b) => a.hour24 - b.hour24);
  });
}