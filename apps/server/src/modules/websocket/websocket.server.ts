import { createHash } from "node:crypto";
import { IncomingMessage, Server } from "node:http";
import { Duplex } from "node:stream";
import { WebSocketServer, WebSocket } from "ws";
import { redis } from "@repo/redis";

export const domainClients = new Map<string, Set<WebSocket>>();

const TICKET_KEY_PREFIX = "websocket:ticket:v1:";
const CONSUME_TICKET_SCRIPT = `
local value = redis.call("GET", KEYS[1])
if value then
  redis.call("DEL", KEYS[1])
end
return value
`;

function rejectUpgrade(socket: Duplex, status: number, message: string) {
  if ((socket as any).destroyed) return;
  socket.write(`HTTP/1.1 ${status} ${message}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
  socket.destroy();
}

export function initWebSocketServer(httpServer: Server) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", async (req: IncomingMessage, socket, head) => {
    let ticket: string | null;
    let requestOrigin: string | null;

    try {
      const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
      ticket = url.searchParams.get("ticket");
      requestOrigin = req.headers.origin ?? null;
    } catch {
      rejectUpgrade(socket, 400, "Bad Request");
      return;
    }

    if (!ticket || !/^[a-f0-9]{64}$/.test(ticket) || !requestOrigin) {
      rejectUpgrade(socket, 401, "Unauthorized");
      return;
    }

    const ticketKey = `${TICKET_KEY_PREFIX}${createHash("sha256").update(ticket).digest("hex")}`;

    let storedTicket: string | null;
    try {
      storedTicket = (await redis.eval(CONSUME_TICKET_SCRIPT, 1, ticketKey)) as string | null;
    } catch (error) {
      console.error("WS SERVER: Failed to verify WebSocket ticket:", error);
      rejectUpgrade(socket, 503, "Service Unavailable");
      return;
    }

    if (!storedTicket) {
      rejectUpgrade(socket, 401, "Unauthorized");
      return;
    }

    let domainId: string;
    let ticketOrigin: string;
    try {
      const parsedTicket = JSON.parse(storedTicket) as unknown;
      if (
        !parsedTicket ||
        typeof parsedTicket !== "object" ||
        !("domainId" in parsedTicket) ||
        typeof (parsedTicket as { domainId?: unknown }).domainId !== "string" ||
        !("origin" in parsedTicket) ||
        typeof (parsedTicket as { origin?: unknown }).origin !== "string"
      ) {
        rejectUpgrade(socket, 401, "Unauthorized");
        return;
      }
      domainId = (parsedTicket as { domainId: string }).domainId;
      ticketOrigin = (parsedTicket as { origin: string }).origin;
    } catch {
      rejectUpgrade(socket, 401, "Unauthorized");
      return;
    }

    if (requestOrigin !== ticketOrigin) {
      rejectUpgrade(socket, 403, "Forbidden");
      return;
    }

    try {
      wss.handleUpgrade(req, socket, head, (ws) => {
        if (!domainClients.has(domainId)) {
          domainClients.set(domainId, new Set());
        }
        domainClients.get(domainId)!.add(ws);
        console.log(`WS SERVER: Connected: ${domainId}`);

        ws.on("close", () => {
          const clients = domainClients.get(domainId);
          clients?.delete(ws);
          console.log(`WS SERVER: Disconnected: ${domainId}`);
          if (clients?.size === 0) domainClients.delete(domainId);
        });
      });
    } catch (error) {
      console.error("WS SERVER: Failed to complete WebSocket upgrade:", error);
      rejectUpgrade(socket, 400, "Bad Request");
    }
  });
}