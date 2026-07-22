// src/modules/websocket/websocket.consumer.ts
import { WebSocket }      from "ws";
import { createConsumer } from "../../kafka/kafkaClient";
import { domainClients }  from "./websocket.server";
import { KAFKA_TOPICS, KAFKA_GROUPS } from "../../config/kafka";
import { checkVisitorNewness } from "./functions/trackVisitor";

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
      if (!clients || clients.size === 0) return; // skip Redis call if no one's listening

      const { isNewVisitor, isNewVisitorFor } = await checkVisitorNewness(
        domainId,
        event.visitorId,
        event.timezone,
        {
          page: event.page,
          referrer: event.referrer,
          browser: event.browser,
          os: event.os,
          device: event.device,
          country: event.country,
        }
      );

      const payloadEvent = { ...event, isNewVisitor, isNewVisitorFor };
      const payload = JSON.stringify({ type: "new_event", data: payloadEvent });

      for (const ws of clients) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
        }
      }
    },
  });
}