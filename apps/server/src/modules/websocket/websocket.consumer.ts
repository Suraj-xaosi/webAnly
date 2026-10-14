import { WebSocket }      from "ws";
import { createConsumer } from "../../shared/config/kafka/kafkaClient.js";
import { domainClients }  from "./websocket.server.js";
import { KAFKA_TOPICS, KAFKA_GROUPS } from "../../shared/config/kafka.js";
import { checkVisitorNewness } from "./functions/trackVisitor.js";

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
      const socketMessage =
        event.type === "new_event" && event.data
          ? event
          : { type: "new_event", data: event };
      const eventData = socketMessage.data;
      const domainId = eventData?.domainId;
      if (typeof domainId !== "string") {
        console.warn("WEBSOCKET CONSUMER: Event is missing domainId");
        return;
      }

      const visitedAt = new Date(eventData.visitedAt);
      if (Number.isNaN(visitedAt.getTime())) {
        console.error("WEBSOCKET CONSUMER: Event has invalid visitedAt");
        return;
      }

      const visitorNewness = await checkVisitorNewness(
        domainId,
        eventData.visitorId,
        eventData.defaultTimezone || eventData.timezone || "UTC",
        visitedAt,
        {
          page: eventData.page,
          referrer: eventData.referrer,
          browser: eventData.browser,
          os: eventData.os,
          device: eventData.device,
          country: eventData.country,
          city: eventData.city,
        }
      );
      socketMessage.data = { ...eventData, ...visitorNewness };

      const clients = domainClients.get(domainId);
      if (!clients || clients.size === 0) return;

      const payload = JSON.stringify(socketMessage);

      for (const ws of clients) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
        }
      }
    },
  });
}