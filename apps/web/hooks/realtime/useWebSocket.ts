// apps/web/hooks/realtime/useWebSocket.ts
import { useEffect, useRef, useState } from "react";
import type { WebSocketMessage } from "@/lib/shared/types/realtime";

export type { WebSocketMessage };

const MAX_BACKOFF_MS = 30_000; // 30 second 

export function useWebSocket(
  domainId: string,
  apikey: string,
  onMessage?: (message: WebSocketMessage) => void,
  wsServerUrl?: string
) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  // Naye refs — reconnect logic ke liye
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnectRef = useRef(true); // cleanup ke waqt false, taaki unmount ke baad reconnect na ho

  useEffect(() => {
    if (!domainId || !apikey) {
      console.warn("useWebSocket: domainId and apikey required");
      return;
    }

    shouldReconnectRef.current = true;

    function connect() {
      let wsUrl: string = process.env.NEXT_PUBLIC_WSS_URL || "ws://localhost:4000";
      wsUrl = `${wsUrl}?apikey=${apikey}&domainId=${domainId}`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptRef.current = 0; // success — backoff reset karo
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

        // Sirf tab reconnect karo jab component abhi bhi mounted hai
        if (!shouldReconnectRef.current) return;

        const attempt = reconnectAttemptRef.current;
        const backoff = Math.min(1000 * 2 ** attempt, MAX_BACKOFF_MS); // 1s, 2s, 4s, 8s... 30s tak cap
        reconnectAttemptRef.current = attempt + 1;

        reconnectTimeoutRef.current = setTimeout(connect, backoff);
      };

      wsRef.current = ws;
    }

    connect();

    return () => {
      shouldReconnectRef.current = false; // pending reconnect timers ko cancel karne ka signal
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [domainId, apikey, wsServerUrl]);

  return { isConnected, ws: wsRef.current };
}