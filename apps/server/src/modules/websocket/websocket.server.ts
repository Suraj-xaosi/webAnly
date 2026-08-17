
import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage }            from "http";
import { Server }                     from "http";
import { apikeyChecker }              from "../../shared/functions/apikeyChecker.js";

// shared Map — imported by websocket.consumer.ts
export const domainClients = new Map<string, Set<WebSocket>>();

export function initWebSocketServer(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
    const url      = new URL(req.url || "", `http://${req.headers.host}`);
    const apikey   = url.searchParams.get("apikey");
    const domainId = url.searchParams.get("domainId");

    if (!apikey || !domainId) {
      ws.close(1008, "WS SERVER: apikey and domainId required");
      return;
    }

    const domain = await apikeyChecker(apikey);

    if (!domain.isActive || domain.domainId !== domainId) {
      ws.close(1008, "WS SERVER: Unauthorized");
      return;
    }

    if (!domainClients.has(domainId)) {
      domainClients.set(domainId, new Set());
    }
    domainClients.get(domainId)!.add(ws);
    console.log(`WS SERVER: Connected: ${domainId}`);

    ws.on("close", () => {
      domainClients.get(domainId)?.delete(ws);
      console.log(`WS SERVER: Disconnected: ${domainId}`);
    });
  });
}