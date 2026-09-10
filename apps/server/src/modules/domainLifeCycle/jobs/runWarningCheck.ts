import { producer } from "../../../shared/config/kafka/kafkaClient.js";
import { KAFKA_TOPICS } from "../../../shared/config/kafka.js";
import { redis } from "@repo/redis";
import { prisma } from "@repo/db";

const WARNING_LOCK_KEY = "cron:domain-warning:lock";
const WARNING_LOCK_TTL_SECONDS = 23 * 60 * 60; // ~23h — self-expiring, keeps this to ~once/day
const WARNING_WINDOW_DAYS = 2;

// in-process only; reset on restart (which just costs one extra redis call, harmless)
let localLockUntil = 0; // epoch ms

export async function runWarningCheck() {
  const now = Date.now();

  if (now < localLockUntil) {
    return; // we already know today's run is locked — zero redis calls
  }

  const acquired = await redis.set(WARNING_LOCK_KEY, "1", "EX", WARNING_LOCK_TTL_SECONDS, "NX");

  // Whichever instance got it, the lock is now known to be held for ~TTL.
  // Cache that locally so *this* instance stops asking redis every hour.
  localLockUntil = now + WARNING_LOCK_TTL_SECONDS * 1000;

  if (acquired !== "OK") {
    return; // some other instance already owns today's run
  }

  const windowEnd = new Date(now + WARNING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const expiringDomains = await prisma.domain.findMany({
    where: {
      state: "ACTIVE",
      endsAt: { gte: new Date(now), lte: windowEnd },
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