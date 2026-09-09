import { producer } from "../../../shared/config/kafka/kafkaClient.js";
import { KAFKA_TOPICS } from "../../../shared/config/kafka.js";
import { redis } from "@repo/redis";
import { prisma } from "@repo/db";


const WARNING_LOCK_KEY = "cron:domain-warning:lock";
const WARNING_LOCK_TTL_SECONDS = 23 * 60 * 60; // ~23h — self-expiring, keeps this to ~once/day
const WARNING_WINDOW_DAYS = 2;

export  async function runWarningCheck() {
  const acquired = await redis.set(WARNING_LOCK_KEY, "1", "EX", WARNING_LOCK_TTL_SECONDS, "NX");
  if (acquired !== "OK") {
    return; // already ran within the lock window — skip entirely
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + WARNING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const expiringDomains = await prisma.domain.findMany({
    where: {
      state: "ACTIVE",
      endsAt: { gte: now, lte: windowEnd },
      deletedAt: null,
    },
    select: { id: true, endsAt: true },
  });

  if (expiringDomains.length === 0) return;

  console.log(`DOMAIN LIFECYCLE CRON: Warning ${expiringDomains.length} domain(s) of upcoming expiry`);

  for (const domain of expiringDomains) {
    try {
      await producer.send({
        topic: KAFKA_TOPICS.NOTIFICATIONS,
        messages: [
          {
            key: domain.id,
            value: JSON.stringify({
              domainId: domain.id,
              type: "DOMAIN_EXPIRING",
              endsAt: domain.endsAt.toISOString(),
            }),
          },
        ],
      });
    } catch (error) {
      console.error(`DOMAIN LIFECYCLE CRON: Failed to send expiry warning for domain ${domain.id}:`, error);
    }
  }
}