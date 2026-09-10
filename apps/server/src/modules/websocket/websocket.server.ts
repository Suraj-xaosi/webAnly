import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage }            from "http";
import { Server }                     from "http";
import { apikeyChecker }              from "../../shared/functions/apikeyChecker.js";
import { onDomainConnect, onDomainDisconnect } from "./functions/domainLifecycle.js";

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

    if (domain.state !== "ACTIVE" || domain.domainId !== domainId) {
      ws.close(1008, "WS SERVER: Unauthorized");
      return;
    }

    const isFirstClientForDomain =
      !domainClients.has(domainId) || domainClients.get(domainId)!.size === 0;

    if (!domainClients.has(domainId)) {
      domainClients.set(domainId, new Set());
    }
    domainClients.get(domainId)!.add(ws);
    console.log(`WS SERVER: Connected: ${domainId}`);

    if (isFirstClientForDomain) {
      // Runs in background — doesn't block the handshake. Events for this
      // domain get null newness flags until seeding finishes (see
      // websocket.consumer.ts + domainLifecycle.isDomainReady).
      onDomainConnect(domainId, domain.defaultTimezone).catch((err) => {
        console.error(`WS SERVER: onDomainConnect failed for ${domainId}`, err);
      });
    }

    ws.on("close", () => {
      const clients = domainClients.get(domainId);
      clients?.delete(ws);
      console.log(`WS SERVER: Disconnected: ${domainId}`);

      if (!clients || clients.size === 0) {
        onDomainDisconnect(domainId, () => (domainClients.get(domainId)?.size ?? 0) > 0);
      }
    });
  });
}