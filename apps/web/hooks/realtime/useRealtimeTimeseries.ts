import { useQueryClient } from "@tanstack/react-query";
import { useTimeseries } from "../analytics/useTimeseries";
import { useRealtimeContext } from "@/components/wrapper/RealtimeProvider";
import { useRealtimeMerge } from "./useRealtimeMerge";
import type { RealtimeTimeseriesResult, WebSocketMessage } from "@/lib/shared/types/realtime";
import type { TimeseriesResponse} from "@/lib/shared/types/analytics"


// Internal shape: same as TimeseriesPoint, plus a numeric hour for sorting.
// hour24 never leaves this hook — the returned `data` is structurally still
// TimeseriesPoint[], consumers don't see or need this field.
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

// Converts a UTC timestamp into the given IANA timezone's local hour, and
// builds the same label format the API produces: "2pm", "12am", etc.
// (hour12, no leading zero, lowercase period, no space — matches the
// route.ts logic: `${hour12}${period}` from getUTCHours() after AT TIME ZONE.)
function getBucketKey(dateStr: string, timezone: string): { label: string } {
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

  return { label };
}

function mergeWebSocketEvent(
  previous: TimeseriesResponse | undefined,
  message: WebSocketMessage,
  timezone: string
): TimeseriesResponse | undefined {
  if (message.type !== "new_event" || !message.data) return;

  const eventData = message.data;
  const eventTimestamp = eventData.visitedAt || eventData.timestamp || new Date().toISOString();
  const { label } = getBucketKey(eventTimestamp, timezone);

  const isNewVisitor = Boolean(eventData.isNewVisitor);

  const data = previous?.data ?? [];
    const existingIdx = data.findIndex((point) => point.date === label);
    const newData = [...data];

    if (existingIdx !== -1) {
      const existing = newData[existingIdx]!;
      newData[existingIdx] = {
        ...existing,
        views: existing.views + 1,
        visitors: existing.visitors + (isNewVisitor ? 1 : 0),
      };
    } else {
      newData.push({
        date: label,
        views: 1,
        visitors: isNewVisitor ? 1 : 0,
      });
    }

    return {
      interval: previous?.interval ?? "hour",
      from: previous?.from ?? "",
      to: previous?.to ?? "",
      data: newData.sort((a, b) => parseHourLabel(a.date) - parseHourLabel(b.date)),
    };
}

function parseHourLabel(label: string): number {
  const period = label.slice(-2);
  const hour12 = parseInt(label, 10);

  if (period === "am") return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}