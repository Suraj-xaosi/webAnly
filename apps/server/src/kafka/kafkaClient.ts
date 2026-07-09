 // src/kafka/kafkaClient.ts
import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID_COLLECTOR || "collector",
  brokers:  (process.env.KAFKA_BROKERS || "localhost:9092").split(",").map(b => b.trim()).filter(Boolean),
});

export const producer = kafka.producer({ allowAutoTopicCreation: false });

export const createConsumer = (groupId: string) =>
  kafka.consumer({ groupId });
 