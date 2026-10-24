import { createConsumer }           from "../../shared/config/kafka/kafkaClient.js";
import dumpInDB                     from "./functions/dumpInDB.js";
import { KAFKA_TOPICS, KAFKA_GROUPS } from "../../shared/config/kafka.js";

const consumer = createConsumer(KAFKA_GROUPS.ANALYTICS_WORKERS);
const DB_RETRY_BACKOFF_MS = 1_000;

async function persistEventWithOneRetry(eventData: Parameters<typeof dumpInDB>[0]) {
  try {
    await dumpInDB(eventData);
  } catch (firstError) {
    console.error(
      `EVENT DUMPING WORKER: Database write failed; retrying once in ${DB_RETRY_BACKOFF_MS}ms`,
      firstError
    );
    await new Promise((resolve) => setTimeout(resolve, DB_RETRY_BACKOFF_MS));

    try {
      await dumpInDB(eventData);
    } catch (retryError) {
      throw new AggregateError(
        [firstError, retryError],
        "EVENT DUMPING WORKER: Database write failed after one retry"
      );
    }
  }
}

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

      await persistEventWithOneRetry(eventData);
    },
  });
}