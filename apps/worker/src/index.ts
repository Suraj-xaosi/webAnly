import { Kafka } from "kafkajs";

import dotenv from "dotenv";
import { prisma } from "@repo/db";
dotenv.config();



const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID_WORKER ?? "collector-worker",
  brokers: (process.env.KAFKA_BROKERS?.split(",") ?? ["localhost:9092"]),
});


const consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID || "event-processors" });

async function run() {
  console.log("Connecting to Kafka broker...");
  await consumer.connect();
  console.log(`Connected. Subscribing to topic '${process.env.TOPIC_NAME || "site-events"}'...`);
  await consumer.subscribe({ topic: process.env.TOPIC_NAME || "site-events", fromBeginning: false }); // For debugging, consume all messages

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        console.log(`Received message on topic ${topic}, partition ${partition}`);
        if (!message.value) {
          console.warn("Message value is empty");
          return;
        }
        const rawValue = message.value.toString();
        console.log("Raw message value:", rawValue);
        let eventData;
        try {
          const parsed = JSON.parse(rawValue);
          eventData = parsed.eventData || parsed; // Support both {eventData} and direct eventData
        } catch (parseErr) {
          console.error("Failed to parse message value as JSON:", parseErr);
          return;
        }
        if (!eventData || !eventData.siteName) {
          console.warn("eventData or siteName missing in message:", eventData);
          return;
        }
        console.log("Processing event data:", eventData);
        const siteName = eventData.siteName;
        const url = eventData.url || "";
        const cameFrom = eventData.cameFrom || null;

        // Fetch site
        const site = await prisma.site.findUnique({
          where: { domain: siteName },
        });
        console.log("Fetched sitedetails:", site);

        if (!site) {
          console.warn(`Site not found: ${siteName}`);
          return;
        }

        // Create daily stat record
        await prisma.dailyStat.create({
          data: {
            siteId: site.id,
            date: new Date(),
            page: url,
            country: eventData.country || null,
            browser: eventData.browser || null,
            device: eventData.device || null
          },
        });

        console.log("Processed event:", eventData);
      } catch (error) {
        console.error("Error processing message:", error);
      }
    },
  });
}

run().catch((err) => {
  console.error("Worker failed to start:", err);
});
