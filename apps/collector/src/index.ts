import express, { Request, Response } from "express";
import { Kafka } from "kafkajs";

import cors from "cors";
import countryFromIp,{normalizeIp} from "./functions/countryFromIp.js";
import parseBrowser from "./functions/parseBrowser.js";

import dotenv from "dotenv";

dotenv.config();

const TOPIC_NAME = process.env.TOPIC_NAME || "site-events";


const app = express();
app.use(express.json());

app.use(cors({
  origin: true, 
  credentials: true,
}));

const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID_COLLECTOR|| "collector",
    brokers: [process.env.KAFKA_BROKERS || "localhost:9092"],
});

const producer = kafka.producer();


function getClientIp(req: Request): string {
    const xff: string = req.get("x-forwarded-for") || "";
    if (xff) {
        const first = xff.split(",")[0]?.trim() || "";
        if (first) return normalizeIp(first);
    }
    const xr = req.get("x-real-ip");
    if (xr) return normalizeIp(xr);
    // express req.ip can be in format ::ffff:127.0.0.1
    if (req.ip) return normalizeIp(req.ip);
    // fallback to connection remoteAddress
    // @ts-ignore
    const remote = (req.connection && req.connection.remoteAddress) || "";
    return normalizeIp(remote || "0.0.0.0");
}


app.post("/collect", async (req: Request, res: Response) => {
    const body = req.body || {};
    console.log(body)

    const site = String(body.site || "");
    const url = String(body.url || "");
    
    if (!site || !url) {
        return res.status(400).send("Missing these required fields: site and url");
    }

    const referrer = String(body.referrer || body.referer || "");
    // Prefer the request user-agent header; fall back to body.userAgent if provided
    const userAgentHeader = req.get("user-agent") || "";
    const userAgentBody = String(body.userAgent || "");
    const userAgent = userAgentHeader || userAgentBody;

    const ua = userAgent || "";
    const device =
        /mobile/i.test(ua) ? "mobile" : /tablet/i.test(ua) ? "tablet" : "desktop";

    const ip = getClientIp(req);
    const country = countryFromIp(ip);

    const eventData = {
        siteName: site,
        country,
        url,
        previousPage: referrer,
        browser: parseBrowser(ua),
        device: device || "Unknown"
        
    };
    console.log("Collected event data:", eventData);

    try {
        await producer.send({
            topic: TOPIC_NAME,
            messages: [{ value: JSON.stringify(eventData) }],
        });
        return res.status(200).send("Event sent to Kafka");
    } catch (err) {
        console.error("Failed to send event to Kafka:", err);
        return res.status(500).send("Failed to send event to Kafka.");
    }
});

async function start() {
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