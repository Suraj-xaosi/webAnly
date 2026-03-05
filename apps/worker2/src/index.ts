import { Kafka } from "kafkajs";
import dotenv from "dotenv";

dotenv.config();


const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID_WORKER2 || "worker2",
  brokers: process.env.KAFKA_BROKERS?.split(",") || ["localhost:9092"],
});



const consumer = kafka.consumer({
  groupId: process.env.KAFKA_GROUP_ID_WORKER2 || "event-processors2",
});



async function run() {

  await consumer.connect();
  await consumer.subscribe({
    topic: process.env.TOPIC_NAME_NOTIFICATIONS || "notifications",
    fromBeginning: false,
  });


  console.log("✅ Kafka worker2 running");


  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      try {
        const parsed = JSON.parse(message.value.toString());

        console.log(`🚨 Spike alert for site: ${parsed.siteId}`);
        console.log(`   Views in 5min : ${parsed.viewsIn5min}`);
        console.log(`   Expected views: ${parsed.expectedViews}`);
        console.log(`   Difference    : ${parsed.difference}`);

      } catch (err) {
        console.error("❌ Invalid JSON message", err);
        return;
      }

    },
  });
}

run().catch((err) => {
  console.error("❌ Worker crashed", err);
});