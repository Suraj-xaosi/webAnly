// src/modules/websocket/websocket.consumer.ts
import { WebSocket }      from "ws";
import { createConsumer } from "../../kafka/kafkaClient";
import { domainClients }  from "./websocket.server";
import { KAFKA_TOPICS, KAFKA_GROUPS } from "../../config/kafka";

const consumer = createConsumer(KAFKA_GROUPS.WEBSOCKET_CONSUMERS);

export async function startWebSocketConsumer() {
  await consumer.connect();
  await consumer.subscribe({
    topic: KAFKA_TOPICS.SOCKET_EVENTS,
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const event = JSON.parse(message.value.toString());
      const domainId = event.domainId as string;

      const clients = domainClients.get(domainId);
      if (!clients || clients.size === 0) return;

      const payload = JSON.stringify({ type: "new_event", data: event });

      for (const ws of clients) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
        }
      }
    },
  });
}