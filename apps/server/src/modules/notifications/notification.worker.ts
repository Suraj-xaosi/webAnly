// src/modules/notifications/notification.worker.ts
import { createConsumer } from "../../kafka/kafkaClient";
import { KAFKA_TOPICS, KAFKA_GROUPS } from "../../config/kafka";

const consumer = createConsumer(KAFKA_GROUPS.NOTIFICATION_WORKERS);

export async function startNotificationWorker() {
  await consumer.connect();
  await consumer.subscribe({
    topic: KAFKA_TOPICS.NOTIFICATIONS,
    fromBeginning: false,
  });

  console.log("✅ Notification worker running");

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      try {
        const parsed = JSON.parse(message.value.toString());

        console.log(`🚨 Spike alert for domain : ${parsed.domainId}`);
        console.log(`   Views in 5min          : ${parsed.visitorCountIn5min}`);
        console.log(`   Expected views          : ${parsed.expectedVisitors}`);
        console.log(`   Difference              : ${parsed.difference}`);

        // add real processing here: email, push notification, webhook, etc.
      } catch (err) {
        console.error("❌ Invalid JSON message", err);
      }
    },
  });
}