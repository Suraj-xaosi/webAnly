// src/modules/spikes/spike.job.ts
import cron                from "node-cron";
import spikeCheck          from "./spikeCheck";
import { createConsumer }  from "../../kafka/kafkaClient";
import { KAFKA_TOPICS, KAFKA_GROUPS } from "../../config/kafka";

// Track domains with activity in this batch
const domainActivitySet = new Set<string>();
let consumerInitialized = false;

export async function startSpikeJob() {
  // Start consuming domain activity events
  const consumer = createConsumer(KAFKA_GROUPS.SPIKE_DETECTORS);

  await consumer.connect();
  await consumer.subscribe({
    topic: KAFKA_TOPICS.DOMAIN_ACTIVITY,
    fromBeginning: false,
  });

  // Consumer accumulates domains with activity
  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      try {
        const { domainId } = JSON.parse(message.value.toString());
        if (domainId) {
          domainActivitySet.add(domainId);
        }
      } catch (err) {
        console.error("❌ Failed to parse domain activity message", err);
      }
    },
  });

  consumerInitialized = true;

  // Process accumulated domains every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    if (domainActivitySet.size === 0) return;

    console.log(
      `🔍 Running spike check for ${domainActivitySet.size} domain(s)`
    );

    const domains = [...domainActivitySet];
    domainActivitySet.clear(); // clear before async work so new events during check go into next batch

    await Promise.all(domains.map((domainId) => spikeCheck(domainId)));
  });

  console.log("✅ Spike job scheduled (every 5 min)");
}