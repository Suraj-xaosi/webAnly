import { Kafka } from "kafkajs";
import dotenv from "dotenv";
import dumpInDB from "./functions/dumpInDB.js";
import spikeCheck from "./functions/spikeCheck.js"; 

dotenv.config();

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID_WORKER || "worker",
  brokers: process.env.KAFKA_BROKERS?.split(",") || ["localhost:9092"],
});

const consumer = kafka.consumer({
  groupId: process.env.KAFKA_GROUP_ID || "event-processors",
});

async function run() {

  await consumer.connect();
  await consumer.subscribe({
    topic: process.env.TOPIC_NAME || "site-events",
    fromBeginning: false,
  });
  console.log("✅ Kafka worker running");


  const SPIKE_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  const siteIdSet = new Set<string>(); // using Set to automatically avoid duplicates

  

  // Every 5 minutes, run spike check for all unique siteIds collected so far
  setInterval(async () => {
    if (siteIdSet.size === 0) return;

    console.log(`🔍 Running spike check for ${siteIdSet.size} sites`);

    await Promise.all([...siteIdSet].map(siteId => spikeCheck(siteId)));
    siteIdSet.clear();
  }, SPIKE_CHECK_INTERVAL);




  await consumer.run({

    eachMessage: async ({ message }) => {
      if (!message.value) return;

      let eventData: any;
      
      try {
        const parsed = JSON.parse(message.value.toString());
        eventData = parsed.eventData || parsed;
      } catch (err) {
        console.error("❌ Invalid JSON message");
        return;
      }

      if (!eventData.siteId || !eventData.visitorId || !eventData.page) {
        console.warn("⚠ Invalid event payload", eventData);
        return;
      }

      // collect siteId for spike check (Set handles dedup automatically)
      siteIdSet.add(eventData.siteId);

      await dumpInDB(eventData);
    },
  });
}

run().catch((err) => {
  console.error("❌ Worker crashed", err);
});
