
import { useEffect, useRef, useState } from "react";
import type { WebSocketMessage } from "@repo/types/realtime";
import { publicEnv } from "@/lib/env/client";

export type { WebSocketMessage };

const MAX_BACKOFF_MS = 30_000; // 30 second 

export function useWebSocket(
  domainId: string,
  onMessage?: (message: WebSocketMessage) => void,
  wsServerUrl?: string
) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!domainId) {
      console.warn("useWebSocket: domainId required");
      return;
    }

    let active = true;

    function scheduleReconnect() {
      if (!active) return;
      const attempt = reconnectAttemptRef.current;
      const backoff = Math.min(1000 * 2 ** attempt, MAX_BACKOFF_MS);
      reconnectAttemptRef.current = attempt + 1;
      reconnectTimeoutRef.current = setTimeout(() => void connect(), backoff);
    }

    async function connect() {
      try {
        const response = await fetch("/api/realtime/ws-ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domainId }),
        });
        if (!response.ok) {
          throw new Error(`WebSocket ticket request failed (${response.status})`);
        }

        const result: unknown = await response.json();
        if (
          !result ||
          typeof result !== "object" ||
          !("ticket" in result) ||
          typeof result.ticket !== "string"
        ) {
          throw new Error("WebSocket ticket response was invalid");
        }
        if (!active) return;

        const wsUrl = new URL(
          wsServerUrl || publicEnv.NEXT_PUBLIC_WSS_URL || "ws://localhost:4000"
        );
        wsUrl.searchParams.set("ticket", result.ticket);
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsConnected(true);
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
          setIsConnected(false);
        };

        ws.onclose = () => {
          setIsConnected(false);
          scheduleReconnect();
        };

        wsRef.current = ws;
      } catch (err) {
        if (!active) return;
        console.error("Failed to establish WebSocket connection:", err);
        setIsConnected(false);
        scheduleReconnect();
      }
    }

    void connect();

    return () => {
      active = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

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
      setIsConnected(false);
    };
  }, [domainId, wsServerUrl]);

  return { isConnected, ws: wsRef.current };
}