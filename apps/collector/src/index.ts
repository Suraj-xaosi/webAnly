import express, { Request, Response } from "express";
import { Kafka } from "kafkajs";
import cors from "cors";
import dotenv from "dotenv";
import parseTime from "./functions/parseTimeSpent.js";
import parseDate from "./functions/parseDate.js";
import  { extractRealIp } from "./functions/extractIP.js";
dotenv.config();

const TOPIC_NAME = process.env.TOPIC_NAME || "";

const app = express();
app.set("trust proxy", true);
app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID_COLLECTOR || "",
  brokers: (process.env.KAFKA_BROKERS || "").split(",").map(b => b.trim()).filter(Boolean),
});

const producer = kafka.producer({
  allowAutoTopicCreation: false, 
});

app.post("/collect", async (req: Request, res: Response) => {
  const body = req.body || {};
  if (!body.siteId || !body.page) {
    return res.status(400).send("Missing required: siteId or pathname");
  }

  

  // Extract real IP from request (handles proxies, IPv6, etc)
  const ip = req.ip  || "";
  console.log("Raw IP from request:", ip);
  const visitorID = extractRealIp(ip);
  console.log("Extracted visitor ID :", visitorID);
  // Get country from IP (now async)
  //const country = await countryFromIp(ip);


  const referrer = String(body.referrer || body.referer || "");
  const date = parseDate(body.ts);
  const timeSpent: number = parseTime(body.timeSpent);

  const eventData = {
    eventType: body.eventType || "unknown",
    siteId: body.siteId,
    visitorId: visitorID,
    currentUrl: body.currentUrl || null,
    pageTitle: body.pageTitle || null,
    page: body.page,
    previousPage: referrer || null,
    browser: body.browser || "Unknown",
    device: body.device || "Unknown",
    os: body.os || "Unknown",
    timeSpent,
    date,
  };

  try {
    await producer.send({
      topic: TOPIC_NAME,
      messages: [{ key: body.siteId, value: JSON.stringify(eventData) }],
    });

    return res.status(200).send("Event sent to Kafka");
  } catch (err) {
    console.error("Error sending to Kafka:", err);
    return res.status(500).send("Failed to send event to Kafka.");
  }
});



async function start() {
  if (!TOPIC_NAME) {
    console.error("TOPIC_NAME environment variable is required.");
    process.exit(1);
  }
  if (!kafka || !producer) {
    console.error("Kafka configuration failed. Check KAFKA_BROKERS and related env vars.");
    process.exit(1);
  }
  try {
    await producer.connect();
    app.listen(4000, () => {
      console.log("Collector service running on port 4000");
    });
  } catch (err) {
    console.error("Failed to start collector service:", err);
    process.exit(1);
  }
}

start();
