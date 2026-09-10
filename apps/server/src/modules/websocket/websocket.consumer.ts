import { WebSocket }      from "ws";
import { createConsumer } from "../../shared/config/kafka/kafkaClient.js";
import { domainClients }  from "./websocket.server.js";
import { KAFKA_TOPICS, KAFKA_GROUPS } from "../../shared/config/kafka.js";
import { checkVisitorNewness } from "./functions/trackVisitor.js";
import { isDomainReady }  from "./functions/domainLifecycle.js";

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

      // ONLY DO ANY WORK — Redis included — IF THERE ARE CONNECTED CLIENTS.
      // This is the gate that makes the whole domainLifecycle system worth it.
      const clients = domainClients.get(domainId);
      if (!clients || clients.size === 0) return;

      let data: Record<string, unknown>;

      if (isDomainReady(domainId)) {
        const { isNewVisitor, isNewVisitorToday, isNewVisitorFor } = await checkVisitorNewness(
          domainId,
          event.visitorId,
          event.defaultTimezone,
          {
            page: event.page,
            referrer: event.referrer,
            browser: event.browser,
            os: event.os,
            device: event.device,
            country: event.country,
          }
        );
        data = { ...event, isNewVisitor, isNewVisitorToday, isNewVisitorFor };
      } else {
        // Seeding still in progress for this domain — send unknown rather
        // than guessing wrong. Frontend should treat null as "unknown",
        // not "false".
        data = { ...event, isNewVisitor: null, isNewVisitorToday: null, isNewVisitorFor: null };
      }

      const payload = JSON.stringify({ type: "new_event", data });

      for (const ws of clients) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
        }
      }
    },
  });
}