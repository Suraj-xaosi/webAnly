import { Kafka } from "kafkajs";

const isProduction = process.env.NODE_ENV === "production";

const brokers = (process.env.KAFKA_BROKERS || "localhost:9092")
  .split(",")
  .map((b) => b.trim())
  .filter(Boolean);

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID_COLLECTOR || "collector",
  brokers,
  ssl: isProduction
    ? {
        rejectUnauthorized: true,
        ca: [process.env.KAFKA_CA_CERT!],
        cert: process.env.KAFKA_ACCESS_CERT!,
        key: process.env.KAFKA_ACCESS_KEY!,
      }
    : undefined,

 
  retry: { retries:3, initialRetryTime: 300, maxRetryTime: 10000 }

});

export const producer = kafka.producer({ allowAutoTopicCreation: false });

export const createConsumer = (groupId: string) =>
  kafka.consumer({ groupId });