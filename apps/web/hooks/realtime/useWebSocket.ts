
import { useCallback, useEffect, useRef, useState } from "react";
import type { WebSocketMessage } from "@/types/realtime";
import { publicEnv } from "@/lib/env/client";

export type { WebSocketMessage };

const MAX_BACKOFF_MS = 30_000; // 30 second 
const TICKET_REQUEST_TIMEOUT_MS = 10_000;
const WS_HANDSHAKE_TIMEOUT_MS = 10_000;
const GENERIC_CONNECTION_ERROR =
  "Live updates are temporarily unavailable. We’ll retry automatically.";

function getConnectionErrorMessage(error: unknown) {
  if (
    error instanceof Error &&
    (error.message.startsWith("Your session may have expired.") ||
      error.message.startsWith("Live updates couldn’t be authorized.") ||
      error.message.startsWith("Live updates are temporarily unavailable."))
  ) {
    return error.message;
  }

  return GENERIC_CONNECTION_ERROR;
}

export function useWebSocket(
  domainId: string,
  onMessage?: (message: WebSocketMessage) => void,
  wsServerUrl?: string
) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retry = useCallback(() => {
    reconnectAttemptRef.current = 0;
    setRetryToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!domainId) {
      setIsConnected(false);
      setConnectionError(null);
      return;
    }

    let active = true;
    let ticketController: AbortController | null = null;
    reconnectAttemptRef.current = 0;
    setIsConnected(false);
    setConnectionError(null);

    function scheduleReconnect() {
      if (!active) return;
      const attempt = reconnectAttemptRef.current;
      const backoff = Math.min(1000 * 2 ** attempt, MAX_BACKOFF_MS);
      reconnectAttemptRef.current = attempt + 1;
      reconnectTimeoutRef.current = setTimeout(() => void connect(), backoff);
    }

    function clearConnectionTimeout() {
      if (connectionTimeoutRef.current !== null) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
    }

    async function connect() {
      try {
        const controller = new AbortController();
        ticketController = controller;
        const ticketTimeout = setTimeout(
          () => controller.abort(),
          TICKET_REQUEST_TIMEOUT_MS
        );
        let response: Response;
        try {
          response = await fetch("/api/realtime/ws-ticket", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domainId }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(ticketTimeout);
          if (ticketController === controller) ticketController = null;
        }
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Your session may have expired. Sign in again to restore live updates.");
          }
          if (response.status === 403) {
            throw new Error(
              "Live updates couldn’t be authorized. Refresh the page and check the selected domain."
            );
          }
          throw new Error("Live updates are temporarily unavailable.");
        }

        const result: unknown = await response.json();
        if (
          !result ||
          typeof result !== "object" ||
          !("ticket" in result) ||
          typeof result.ticket !== "string"
        ) {
          throw new Error("Live updates are temporarily unavailable.");
        }
        if (!active) return;

        const wsUrl = new URL(
          wsServerUrl || publicEnv.NEXT_PUBLIC_WSS_URL || "ws://localhost:4000"
        );
        wsUrl.searchParams.set("ticket", result.ticket);
        const ws = new WebSocket(wsUrl);
        connectionTimeoutRef.current = setTimeout(() => {
          if (ws.readyState !== WebSocket.CONNECTING) return;
          setConnectionError("The live connection timed out. We’ll retry automatically.");
          ws.close();
        }, WS_HANDSHAKE_TIMEOUT_MS);

        ws.onopen = () => {
          if (!active) return;
          clearConnectionTimeout();
          setIsConnected(true);
          setConnectionError(null);
          reconnectAttemptRef.current = 0;
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            onMessageRef.current?.(message);
          } catch (err) {
            console.error("Failed to parse WS message:", err);
          }
        };

        ws.onerror = () => {
          if (!active) return;
          clearConnectionTimeout();
          setIsConnected(false);
          setConnectionError("The live connection was interrupted. We’ll retry automatically.");
        };

        ws.onclose = () => {
          if (!active) return;
          clearConnectionTimeout();
          setIsConnected(false);
          setConnectionError((current) =>
            current ?? "The live connection closed. We’ll retry automatically."
          );
          scheduleReconnect();
        };

        wsRef.current = ws;
      } catch (err) {
        if (!active) return;
        console.error("Failed to establish WebSocket connection:", err);
        setIsConnected(false);
        setConnectionError(getConnectionErrorMessage(err));
        scheduleReconnect();
      }
    }

    void connect();

    return () => {
      active = false;
      ticketController?.abort();
      ticketController = null;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      clearConnectionTimeout();

      const ws = wsRef.current;
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
        wsRef.current = null;
      }
    }
  }, [domainId, retryToken, wsServerUrl]);

  return { isConnected, connectionError, retry, ws: wsRef.current };
}