import { Kafka } from "kafkajs";
import dotenv from "dotenv";
import { prisma } from "@repo/db";

dotenv.config();

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID_WORKER || "worker",
  brokers: process.env.KAFKA_BROKERS?.split(",") || ["localhost:9092"],
});

const consumer = kafka.consumer({
  groupId: process.env.KAFKA_GROUP_ID || "event-processors",
});

async function run() {
  console.log("Connecting to Kafka...");
  await consumer.connect();

  const topic = process.env.TOPIC_NAME || "";
  console.log(`Connected. Subscribing to topic '${topic}'...`);

  await consumer.subscribe({ topic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        if (!message.value) {
          console.warn("Message received but value is null");
          return;
        }

        const rawValue = message.value.toString();
        console.log(`Raw message from Kafka: ${rawValue}`);

        let eventData;

        // Parse JSON safely
        try {
          const parsed = JSON.parse(rawValue);

          // Support both {eventData} wrapper or plain object
          eventData = parsed.eventData || parsed;
        } catch (err) {
          console.error("❌ Failed to parse Kafka message JSON:", err);
          return;
        }

        if (!eventData) {
          console.warn("⚠ eventData missing in message");
          return;
        }

        if (!eventData.siteId) {
          console.warn("⚠ siteId missing:", eventData);
          return;
        }

        console.log("Processing event:", eventData);

        // Insert into dailyStat table
        await prisma.dailyStat.create({
          data: {
            siteId: eventData.siteId,
            visitorId:eventData.visitorId,
            eventType: eventData.eventType || "unknown",
            page: eventData.page,
            pageTitle: eventData.pageTitle || null,
            previousPage: eventData.previousPage || null,
            os: eventData.os || null,
            browser: eventData.browser || null,
            device: eventData.device || null,
            country: eventData.country || null,
            TimeSpent: eventData.timeSpent || null,
            IpAddress: eventData.ipAddress || null,

            // Ensure date is always valid
            date: eventData.date
              ? new Date(eventData.date)
              : new Date(),
          },
        });

        console.log("✅ Event processed successfully!");
      } catch (error) {
        console.error("❌ Error processing Kafka message:", error);
      }
    },
  });
}

run().catch((err) => {
  console.error("❌ Worker failed to start:", err);
});
