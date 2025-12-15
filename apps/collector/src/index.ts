import express, { Request, Response } from "express";
import { Kafka } from "kafkajs";
import cors from "cors";
import countryFromIp, { normalizeIp } from "./functions/countryFromIp.js";
import dotenv from "dotenv";

dotenv.config();


const TOPIC_NAME = process.env.TOPIC_NAME || "";


const app = express();
// If behind a proxy (e.g., nginx, Vercel), trust proxy headers for correct req.ip
app.set("trust proxy", true);
app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);


// Kafka setup
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID_COLLECTOR || "",
  // Accept comma-separated list for brokers, like worker does
  brokers: (process.env.KAFKA_BROKERS || "").split(",").map(b => b.trim()).filter(Boolean),
});

const producer = kafka.producer({
  allowAutoTopicCreation: false, // prevents accidental topic creation
});

// -------- IP Extraction ----------
function getClientIp(req: Request): string {
  const xff = req.get("x-forwarded-for") || "";
  //@ts-ignore
  if (xff) return normalizeIp(xff.split(",")[0].trim());

  const xr = req.get("x-real-ip");
  if (xr) return normalizeIp(xr);

  if (req.ip) return normalizeIp(req.ip);

  // @ts-ignore
  return normalizeIp(req.connection?.remoteAddress || "0.0.0.0");
}

// -------- COLLECT ENDPOINT ----------

app.post("/collect", async (req: Request, res: Response) => {
  const body = req.body || {};
  // Consider removing or redacting sensitive fields if logging in production
  // console.log("Incoming raw payload:", body);
  console.log("Incoming event for siteId:", body.siteId || "unknown");
  const siteId = String(body.siteId || "");
  const siteName = String(body.siteName || ""); // Only store if needed later
  const page = String(body.pathname || ""); // preferred: pathname

  if (!siteId || !siteName || !page) {
    return res
      .status(400)
      .send("Missing required: siteName or siteId or pathname");
  }

  const referrer = String(body.referrer || body.referer || "");
  const userAgent = req.get("user-agent") || String(body.userAgent || "");

  const ip = getClientIp(req);
  const country = countryFromIp(ip) ||body.country || "Unknown";

  // Normalize date: accept ISO string, ms number, or fallback to now
  let date: Date;
  if (body.ts) {
    if (typeof body.ts === "string" || typeof body.ts === "number") {
      const d = new Date(body.ts);
      date = isNaN(d.getTime()) ? new Date() : d;
    } else {
      date = new Date();
    }
  } else {
    date = new Date();
  }

  // timeSpent: preserve 0 (not fallback to 0 if 0 is sent)
  let timeSpent = 0;
  if (typeof body.timeSpent === "number") {
    timeSpent = body.timeSpent;
  } else if (typeof body.timeSpent === "string" && body.timeSpent.trim() !== "") {
    const parsed = Number(body.timeSpent);
    timeSpent = isNaN(parsed) ? 0 : parsed;
  }

  const eventData = {
    eventType: body.eventType || "unknown",
    siteId,
    // siteName: store only if you need it later
    // siteName,
    visitorId: body.visitorId || null,
    currentUrl: body.currentUrl || null,
    pageTitle: body.pageTitle || null,
    country,
    page,
    previousPage: referrer || null,
    browser: body.browser || "Unknown",
    device: body.device || "Unknown",
    os: body.os || "Unknown",
    timeSpent,
    date,
    ipAddress: ip || body.ipAddress || "0.0.0.0",
  };

  // console.log("Collected event data:", eventData); // Remove or redact in production

  try {
    await producer.send({
      topic: TOPIC_NAME,
      messages: [{ value: JSON.stringify(eventData) }],
    });
    console.log("Event sent to Kafka:", eventData);
    return res.status(200).send("Event sent to Kafka");
  } catch (err) {
    console.error("Failed to send event to Kafka:", err);
    return res.status(500).send("Failed to send event to Kafka.");
  }
});


// -------- SERVER START ----------
async function start() {
  // Validate required env vars at startup
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
