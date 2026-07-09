/*import express, { Request, Response } from "express";
import { Kafka }                      from "kafkajs";
import { createServer }               from "http";
import { WebSocketServer, WebSocket } from "ws";
import cors                           from "cors";
import dotenv                         from "dotenv";
import parseTime                      from "./functions/parseTimeSpent";
import parseDate                      from "./functions/parseDate";
import { extractRealIp }              from "./functions/extractIP";
import { apikeyChecker }              from "./functions/apikeyChecker";

dotenv.config();

const TOPIC_NAME        = process.env.TOPIC_NAME        || "";
const SOCKET_TOPIC_NAME = process.env.SOCKET_TOPIC_NAME || "socket.site-events";

const app        = express();
const httpServer = createServer(app);         // wrap express in raw http server
const wss        = new WebSocketServer({ server: httpServer }); // attach WS to same port

app.set("trust proxy", true);
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// ── Kafka setup ────────────────────────────────────────────────────────────────

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID_COLLECTOR || "",
  brokers:  (process.env.KAFKA_BROKERS || "").split(",").map(b => b.trim()).filter(Boolean),
});

const producer = kafka.producer({ allowAutoTopicCreation: false });
const consumer = kafka.consumer({ groupId: "collector-ws-group" });

// ── WebSocket: track connected clients per domainId ────────────────────────────

// key = domainId, value = Set of all ws connections watching that domain
const domainClients = new Map<string, Set<WebSocket>>();

wss.on("connection", (ws, req) => {
  const url      = new URL(req.url || "", `http://${req.headers.host}`);
  const apikey   = url.searchParams.get("apikey");
  const domainId = url.searchParams.get("domainId");

  // missing params → reject
  if (!apikey || !domainId) {
    ws.close(1008, "apikey and domainId required");
    return;
  }

  // check db
  const domain = await apikeyChecker(apikey);

  // apikey not found, inactive, or domainId doesnt match → reject
  if (!domain.isActive || domain.domainId !== domainId) {
    ws.close(1008, "Unauthorized");
    return;
  }

  // register this client under its domainId
  if (!domainClients.has(domainId)) {
    domainClients.set(domainId, new Set());
  }
  domainClients.get(domainId)!.add(ws);
  console.log(`WS client connected for domain: ${domainId}`);

  ws.on("close", () => {
    domainClients.get(domainId)?.delete(ws);
    console.log(`WS client disconnected for domain: ${domainId}`);
  });
});

// ── /collect route ─────────────────────────────────────────────────────────────

app.post("/collect", async (req: Request, res: Response) => {
  const body = req.body || {};

  if (!body.apikey || !body.page) {
    return res.status(400).send("Missing required: apikey and page");
  }

  const domain = await apikeyChecker(body.apikey);
  if (!domain.isActive) return res.status(403).json({ error: "Domain inactive" });

  const ip        = req.ip || "";
  const visitorID = extractRealIp(ip);
  const visitedAt = parseDate(body.visitedAt) || new Date();
  const timeSpent = parseTime(body.timeSpent);

  const eventData = {
    domainId:   domain.domainId,
    domainName: domain.domainName,
    visitorId:  visitorID,
    pageTitle:  body.pageTitle  || null,
    page:       body.page,
    referrer:   body.referrer   || null,
    browser:    body.browser    || "Unknown",
    device:     body.device     || "Unknown",
    os:         body.os         || "Unknown",
    timezone:   body.timezone   || "Unknown",
    timeSpent,
    visitedAt,
  };

  try {
    // produce to both topics in one send call
    await producer.send({
      topic:    TOPIC_NAME,
      messages: [{ key: body.siteId, value: JSON.stringify(eventData) }],
    });

    await producer.send({
      topic:    SOCKET_TOPIC_NAME,
      messages: [{ key: domain.domainId, value: JSON.stringify(eventData) }],
    });

    return res.status(200).send("Event sent to Kafka");
  } catch (err) {
    console.error("Error sending to Kafka:", err);
    return res.status(500).send("Failed to send event to Kafka.");
  }
});

// ── Kafka consumer: socket.site-events → WebSocket ────────────────────────────

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: SOCKET_TOPIC_NAME, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const event    = JSON.parse(message.value.toString());
      const domainId = event.domainId as string;

      // find all WS clients watching this domainId on THIS server instance
      const clients = domainClients.get(domainId);
      if (!clients || clients.size === 0) return;

      const payload = JSON.stringify({ type: "new_event", data: event });

      for (const ws of clients) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
        }
      }
    },
  });
}

// ── start everything ───────────────────────────────────────────────────────────

async function start() {
  if (!TOPIC_NAME) {
    console.error("TOPIC_NAME environment variable is required.");
    process.exit(1);
  }

  try {
    await producer.connect();
    await startConsumer();                        // consumer starts here

    httpServer.listen(4000, () => {               // httpServer not app.listen
      console.log("Collector service running on port 4000");
    });
  } catch (err) {
    console.error("Failed to start collector service:", err);
    process.exit(1);
  }
}

start();*/