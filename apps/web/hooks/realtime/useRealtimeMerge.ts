import { startTransition, useEffect, useRef } from "react";
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { WebSocketMessage } from "./useWebSocket";

const BATCH_WINDOW_MS = 100;

type MergeFn<T> = (previous: T | undefined, message: WebSocketMessage) => T | undefined;

export function useRealtimeMerge<T>({
  enabled,
  queryClient,
  queryKey,
  subscribe,
  merge,
}: {
  enabled: boolean;
  queryClient: QueryClient;
  queryKey: QueryKey;
  subscribe: (listener: (message: WebSocketMessage) => void) => () => void;
  merge: MergeFn<T>;
}) {
  const queryClientRef = useRef(queryClient);
  const queryKeyRef = useRef(queryKey);
  const mergeRef = useRef(merge);
  const pendingRef = useRef<WebSocketMessage[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryKeyHash = JSON.stringify(queryKey);

  queryClientRef.current = queryClient;
  queryKeyRef.current = queryKey;
  mergeRef.current = merge;

  useEffect(() => {
    if (!enabled) return;

    const flush = () => {
      timerRef.current = null;
      const messages = pendingRef.current;
      pendingRef.current = [];
      if (messages.length === 0) return;

      startTransition(() => {
        queryClientRef.current.setQueryData<T>(queryKeyRef.current, (previous) =>
          messages.reduce((current, message) => mergeRef.current(current, message), previous)
        );
      });
    };

    const unsubscribe = subscribe((message) => {
      pendingRef.current.push(message);
      if (timerRef.current === null) {
        timerRef.current = setTimeout(flush, BATCH_WINDOW_MS);
      }
    });

    return () => {
      unsubscribe();
      pendingRef.current = [];
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, subscribe, queryKeyHash]);
}
