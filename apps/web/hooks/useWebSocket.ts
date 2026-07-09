// hooks/useWebSocket.ts
import { useEffect, useRef, useState } from "react";

export interface WebSocketMessage {
  type: string;
  data?: Record<string, any>;
}

export function useWebSocket(
  domainId: string,
  apikey: string,
  onMessage?: (message: WebSocketMessage) => void,
  wsServerUrl?: string
) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Keep latest onMessage in a ref — prevents WS reconnect on every render
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!domainId || !apikey) {
      console.warn("useWebSocket: domainId and apikey required");
      return;
    }

    let wsUrl: string;

    if (wsServerUrl) {
      wsUrl = `${wsServerUrl}?apikey=${apikey}&domainId=${domainId}`;
    } else {
      const protocol =
        typeof window !== "undefined" && window.location.protocol === "https:"
          ? "wss:"
          : "ws:";
      // Your backend runs on port 4000, not same host as Next.js (3000)
      wsUrl = `${protocol}//${window.location.hostname}:4000?apikey=${apikey}&domainId=${domainId}`;
    }

    console.log("🔌 Connecting to WebSocket:", wsUrl.split("?")[0]);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessageRef.current?.(message); // always calls latest callback
        } catch (err) {
          console.error("Failed to parse WS message:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log("⚠️ WebSocket disconnected");
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
      setIsConnected(false);
    }

    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  // onMessage intentionally excluded — handled via ref above
  }, [domainId, apikey, wsServerUrl]);

  return { isConnected, ws: wsRef.current };
}