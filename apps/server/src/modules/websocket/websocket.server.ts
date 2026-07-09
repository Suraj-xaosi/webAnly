// server/src/modules/websocket/websocket.server.ts
import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage }            from "http";
import { Server }                     from "http";
import { apikeyChecker }              from "../../functions/apikeyChecker";

// shared Map — imported by websocket.consumer.ts
export const domainClients = new Map<string, Set<WebSocket>>();

export function initWebSocketServer(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
    const url      = new URL(req.url || "", `http://${req.headers.host}`);
    const apikey   = url.searchParams.get("apikey");
    const domainId = url.searchParams.get("domainId");

    if (!apikey || !domainId) {
      ws.close(1008, "apikey and domainId required");
      return;
    }

    const domain = await apikeyChecker(apikey);

    if (!domain.isActive || domain.domainId !== domainId) {
      ws.close(1008, "Unauthorized");
      return;
    }

    if (!domainClients.has(domainId)) {
      domainClients.set(domainId, new Set());
    }
    domainClients.get(domainId)!.add(ws);
    console.log(`WS connected: ${domainId}`);

    ws.on("close", () => {
      domainClients.get(domainId)?.delete(ws);
      console.log(`WS disconnected: ${domainId}`);
    });
  });
}