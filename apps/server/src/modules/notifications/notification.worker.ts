import { prisma, NotificationType } from "@repo/db";
import { createConsumer } from "../../shared/config/kafka/kafkaClient.js";
import { KAFKA_TOPICS, KAFKA_GROUPS } from "../../shared/config/kafka.js";

const consumer = createConsumer(KAFKA_GROUPS.NOTIFICATION_WORKERS);

const VALID_NOTIFICATION_TYPES = new Set<NotificationType>([
  "SPIKE_ALERT",
  "DOMAIN_EXPIRING",
  "DOMAIN_EXPIRED",
  "BILLING",
  "SYSTEM",
]);

interface NotificationContent {
  title: string;
  message: string;
  data: Record<string, unknown>;
}

// ── Per-type content builders ─────────────────────────────────────────────
// Each producer (spikeCheck.ts, the expiry cron, the warning cron, the
// payment webhook) sends whatever fields are relevant to its own event.
// This worker never assumes a shape beyond `domainId` + `type` — everything
// else is read defensively per-type below.

function buildSpikeAlert(domainName: string, parsed: any): NotificationContent {
  const { visitorCountIn5min, expectedVisitors, difference, spikeDate } = parsed;
  const spikeAt = spikeDate ? new Date(spikeDate) : new Date();

  return {
    title: `🚨 Traffic spike on ${domainName}`,
    message: `Got ${visitorCountIn5min} visitors, above the expected ${expectedVisitors}.`,
    data: {
      visitorCountIn5min,
      expectedVisitors,
      difference,
      spikeDate: spikeAt.toISOString(),
    },
  };
}

function buildDomainExpiring(domainName: string, parsed: any): NotificationContent {
  const { endsAt } = parsed;
  const endsAtDate = endsAt ? new Date(endsAt) : null;
  const readable = endsAtDate
    ? endsAtDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : "soon";

  return {
    title: `⏳ ${domainName} is expiring soon`,
    message: `This domain's plan ends on ${readable}. Extend or reactivate to keep tracking running.`,
    data: {
      endsAt: endsAtDate ? endsAtDate.toISOString() : null,
    },
  };
}

function buildDomainExpired(domainName: string, parsed: any): NotificationContent {
  const { endsAt } = parsed;
  const endsAtDate = endsAt ? new Date(endsAt) : null;

  return {
    title: `🔒 ${domainName} has been deactivated`,
    message: `This domain's plan expired and event collection has stopped. Reactivate to resume tracking.`,
    data: {
      endsAt: endsAtDate ? endsAtDate.toISOString() : null,
    },
  };
}

// Placeholder for BILLING (payment webhook lands this later) and as the
// safe fallback for SYSTEM / any unrecognized type.
function buildGeneric(domainName: string, type: NotificationType, parsed: any): NotificationContent {
  return {
    title: `Notification for ${domainName}`,
    message: `You have a new ${type.toLowerCase().replace(/_/g, " ")} notification.`,
    data: { ...parsed },
  };
}

export async function startNotificationWorker() {
  await consumer.connect();
  await consumer.subscribe({
    topic: KAFKA_TOPICS.NOTIFICATIONS,
    fromBeginning: false,
  });

  console.log("NOTIFICATION WORKER:  Notification worker running");

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      let parsed: any;
      try {
        parsed = JSON.parse(message.value.toString());
      } catch (err) {
        console.error("NOTIFICATION WORKER: ❌ Invalid JSON message", err);
        return;
      }

      const { domainId, type: rawType } = parsed;

      if (!domainId) {
        console.warn("NOTIFICATION WORKER: ⚠ Notification missing domainId, skipping", parsed);
        return;
      }

      const isKnownType = VALID_NOTIFICATION_TYPES.has(rawType);
      const type: NotificationType = isKnownType ? rawType : "SYSTEM";

      if (!isKnownType) {
        console.warn(
          `NOTIFICATION WORKER: ⚠ Unknown/missing notification type "${rawType}", falling back to SYSTEM`,
          parsed
        );
      }

      try {
        const domain = await prisma.domain.findUnique({
          where: { id: domainId },
          select: { userId: true, domainName: true },
        });

        if (!domain) {
          console.warn(`NOTIFICATION WORKER: ⚠ Domain not found for notification: ${domainId}`);
          return;
        }

        let content: NotificationContent;
        switch (type) {
          case "SPIKE_ALERT":
            content = buildSpikeAlert(domain.domainName, parsed);
            break;
          case "DOMAIN_EXPIRING":
            content = buildDomainExpiring(domain.domainName, parsed);
            break;
          case "DOMAIN_EXPIRED":
            content = buildDomainExpired(domain.domainName, parsed);
            break;
          case "BILLING":
          case "SYSTEM":
          default:
            content = buildGeneric(domain.domainName, type, parsed);
        }

        await prisma.notification.create({
          data: {
            userId: domain.userId,
            type,
            title: content.title,
            message: content.message,
            data: {
              domainId,
              domainName: domain.domainName,
              ...content.data,
            },
          },
        });

        console.log(
          `NOTIFICATION WORKER: Notification stored for user ${domain.userId} (domain ${domainId}, type ${type})`
        );
      } catch (err) {
        console.error("NOTIFICATION WORKER:  Failed to process notification", err);
      }
    },
  });
}