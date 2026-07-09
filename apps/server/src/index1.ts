//index1.ts - Main entry point for the Collector service. Handles incoming tracking data and sends it to Kafka.
/*import express, { Request, Response } from "express";
import { Kafka }                      from "kafkajs";
import cors                           from "cors";
import dotenv                         from "dotenv";
import parseTime                      from "./functions/parseTimeSpent";
import parseDate                      from "./functions/parseDate";
import { extractRealIp }              from "./functions/extractIP";
import { apikeyChecker }              from "./functions/apikeyChecker";


dotenv.config();

const TOPIC_NAME = process.env.TOPIC_NAME || "";


const app = express();
app.set("trust proxy", true);
app.use(express.json());
app.use(
  cors({
    origin:      true,
    credentials: true,
  })
);

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID_COLLECTOR || "",
  brokers:  (process.env.KAFKA_BROKERS || "").split(",").map(b => b.trim()).filter(Boolean),
});

const producer = kafka.producer({
  allowAutoTopicCreation: false, 
});

app.post("/collect", async (req: Request, res: Response) => {


  const body = req.body || {};
  if (!body.apikey || !body.page) {
    return res.status(400).send("Missing required: apikey and page");
  }

  
  const domain = await apikeyChecker(body.apikey);
  if (!domain.isActive) return res.status(403).json({ error: "Domain inactive" });



  // Extract real IP from request (handles proxies, IPv6, etc)
  const ip = req.ip  || "";
  console.log("Raw IP from request:", ip);
  const visitorID = extractRealIp(ip);
  console.log("Extracted visitor ID :", visitorID);


  
  const visitedAt         = parseDate(body.visitedAt) || new Date();
  const timeSpent: number = parseTime(body.timeSpent);



  const eventData = {

    domainId:      domain.domainId,
    domainName:    domain.domainName,
    visitorId:     visitorID,
    pageTitle:     body.pageTitle || null,
    page:          body.page,
    referrer:      body.referrer || null,
    browser:       body.browser || "Unknown",
    device:        body.device || "Unknown",
    os:            body.os || "Unknown",
    timezone:      body.timezone || "Unknown",
    timeSpent,
    visitedAt,

  };



  try {
    
    await producer.send({

      topic:    TOPIC_NAME,
      messages: [{ key: body.siteId, value: JSON.stringify(eventData) }],

    });

    return res.status(200).send("Event sent to Kafka");

  } 
  catch (err) {

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
*/