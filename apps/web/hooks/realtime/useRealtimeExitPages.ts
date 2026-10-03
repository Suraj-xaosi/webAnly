import { useQueryClient } from "@tanstack/react-query";
import { useExitPages } from "../analytics/useExitPages";
import { useRealtimeContext } from "@/components/wrapper/RealtimeProvider";
import { useRealtimeMerge } from "./useRealtimeMerge";
import { queryKeys } from "@/lib/shared/tanstackFunctions/queryKeys";
import type { ExitPagesResponse } from "@/lib/shared/types/analytics";
import type { WebSocketMessage } from "@/lib/shared/types/realtime";

export function useRealtimeExitPages(
  domainId: string,
  from: string,
  to: string,
  timezone: string,
  enabled: boolean,
  pageViews: { name: string; views: number }[]
) {
  const restQuery = useExitPages({ domainId, from, to, timezone });
  const queryClient = useQueryClient();
  const { subscribe } = useRealtimeContext();
  const queryKey = queryKeys.analytics.exitPages(domainId, from, to, 100, timezone);

  useRealtimeMerge<ExitPagesResponse>({
    enabled,
    queryClient,
    queryKey,
    subscribe,
    merge: (previous, message) =>
      mergeWebSocketEvent(previous, message, from, to, timezone),
  });

  const data =
    restQuery.data?.data.map((point) => {
      const liveViews = pageViews.find((page) => page.name === point.name)?.views;
      const views = Math.max(point.views, liveViews ?? 0);
      return {
        ...point,
        views,
        exitRate: views > 0 ? +((point.exits / views) * 100).toFixed(1) : 0,
      };
    }) ?? [];

  return {
    data,
    isLoading: !enabled || (restQuery.isLoading && restQuery.data === undefined),
    isError: restQuery.isError,
    error: restQuery.error,
    refetch: restQuery.refetch,
  };
}

function mergeWebSocketEvent(
  previous: ExitPagesResponse | undefined,
  message: WebSocketMessage,
  from: string,
  to: string,
  timezone: string
): ExitPagesResponse | undefined {
  if (message.type !== "new_event" || !message.data) return;

  const page = message.data.page;
  if (message.data.exitType !== "pagehide" || typeof page !== "string" || !page) {
    return;
  }

  const visitedAt = message.data.visitedAt;
  if (typeof visitedAt !== "string") return;
  const eventDay = new Date(visitedAt);
  if (Number.isNaN(eventDay.getTime())) return;
  const dateInTimezone = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
  }).format(eventDay);
  if (dateInTimezone < from || dateInTimezone > to) return;

  const data = previous?.data ?? [];
  const existing = data.find((point) => point.name === page);
  const updatedPoint = existing
    ? { ...existing, exits: existing.exits + 1 }
    : { name: page, views: 0, exits: 1, exitRate: 0 };
  const nextData = existing
    ? data.map((point) => (point.name === page ? updatedPoint : point))
    : [...data, updatedPoint];

  return {
    from: previous?.from ?? from,
    to: previous?.to ?? to,
    timezone: previous?.timezone ?? timezone,
    total: nextData.length,
    data: nextData.sort((left, right) => right.exits - left.exits),
  };
}
