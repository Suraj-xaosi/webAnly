import { WebSocket } from "ws";
import { domainClients } from "./websocket.server.js";

export function broadcastDomainEvent(domainId: string, data: unknown) {
  const clients = domainClients.get(domainId);
  if (!clients?.size) return;

  const payload = JSON.stringify({ type: "new_event", data });
  for (const ws of clients) {
    if (ws.readyState !== WebSocket.OPEN) continue;
    try {
      ws.send(payload, (error) => {
        if (error) console.error("WEBSOCKET BROADCAST: Failed to send event", error);
      });
    } catch (error) {
      console.error("WEBSOCKET BROADCAST: Failed to send event", error);
    }
  }
}
