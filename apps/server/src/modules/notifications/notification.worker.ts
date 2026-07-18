// src/modules/notifications/notification.worker.ts
import { prisma } from "@repo/db";
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

      let parsed: any;
      try {
        parsed = JSON.parse(message.value.toString());
      } catch (err) {
        console.error("❌ Invalid JSON message", err);
        return;
      }

      const { domainId, visitorCountIn5min, expectedVisitors, difference, type, spikeDate } = parsed;

      if (!domainId) {
        console.warn("⚠ Notification missing domainId, skipping", parsed);
        return;
      }

      try {
        const domain = await prisma.domain.findUnique({
          where: { id: domainId },
          select: { userId: true, domainName: true },
        });

        if (!domain) {
          console.warn(`⚠ Domain not found for notification: ${domainId}`);
          return;
        }

        // spikeDate arrives as an ISO string over Kafka, not a Date instance
        const parsedDate = spikeDate ? new Date(spikeDate) : new Date();
        const readableTime = parsedDate.toLocaleString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        await prisma.notification.create({
          data: {
            userId: domain.userId,
            type: type ?? "SPIKE_ALERT",
            title: `🚨 Traffic spike on ${domain.domainName}`,
            message: `Got ${visitorCountIn5min} visitors, above the expected ${expectedVisitors}.`,
            date: parsedDate,
            data: {
              domainId,
              domainName: domain.domainName,
              visitorCountIn5min,
              expectedVisitors,
              difference,
            },
          },
        });

        console.log(`✅ Notification stored for user ${domain.userId} (domain ${domainId})`);
      } catch (err) {
        console.error("❌ Failed to process notification", err);
      }
    },
  });
}