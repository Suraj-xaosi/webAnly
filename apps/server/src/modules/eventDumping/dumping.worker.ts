// src/modules/eventDumping/dumping.worker.ts
import { createConsumer, producer } from "../../kafka/kafkaClient";
import dumpInDB                     from "./functions/dumpInDB";
import { KAFKA_TOPICS, KAFKA_GROUPS } from "../../config/kafka";

const consumer = createConsumer(KAFKA_GROUPS.ANALYTICS_WORKERS);

export async function startAnalyticsWorker() {
  await consumer.connect();
  await consumer.subscribe({
    topic: KAFKA_TOPICS.SITE_EVENTS,
    fromBeginning: false,
  });

  console.log("✅ Analytics worker running");

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      let eventData: any;

      try {
        const parsed = JSON.parse(message.value.toString());
        eventData = parsed.eventData || parsed;
      } catch {
        console.error("❌ Invalid JSON message");
        return;
      }

      if (!eventData.domainId || !eventData.visitorId || !eventData.page) {
        console.warn("⚠ Invalid event payload", eventData);
        return;
      }

      // Store event in database
      await dumpInDB(eventData);

      // Publish domain activity for spike detection
      try {
        await producer.send({
          topic: KAFKA_TOPICS.DOMAIN_ACTIVITY,
          messages: [
            {
              key: eventData.domainId,
              value: JSON.stringify({
                domainId: eventData.domainId,
                timestamp: new Date().toISOString(),
              }),
            },
          ],
        });
      } catch (err) {
        console.error("❌ Failed to publish domain activity", err);
      }
    },
  });
}