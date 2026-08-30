import { createConsumer }           from "../../shared/config/kafka/kafkaClient.js";
import dumpInDB                     from "./functions/dumpInDB.js";
import { KAFKA_TOPICS, KAFKA_GROUPS } from "../../shared/config/kafka.js";
import { redis }                    from "@repo/redis";
import { DOMAIN_ACTIVITY_SET_KEY }  from "../../shared/config/rediskeys.js";

const consumer = createConsumer(KAFKA_GROUPS.ANALYTICS_WORKERS);

export async function startAnalyticsWorker() {
  await consumer.connect();
  await consumer.subscribe({
    topic: KAFKA_TOPICS.SITE_EVENTS,
    fromBeginning: false,
  });

  console.log(" EVENT DUMPING WORKER: Analytics worker running");

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      let eventData: any;
      try {
        const parsed = JSON.parse(message.value.toString());
        eventData = parsed.eventData || parsed;
      } catch {
        console.error(" EVENT DUMPING WORKER: Invalid JSON message");
        return;
      }

      if (!eventData.domainId || !eventData.visitorId || !eventData.page) {
        console.warn("⚠ EVENT DUMPING WORKER: Invalid event payload", eventData);
        return;
      }

      // Store event in database
      await dumpInDB(eventData);

      // Mark domain as active for spike detection 
      try {
        await redis.sadd(DOMAIN_ACTIVITY_SET_KEY, eventData.domainId);
      } catch (err) {
        console.error(" EVENT DUMPING WORKER: Failed to mark domain activity in Redis", err);
      }
    },
  });
}