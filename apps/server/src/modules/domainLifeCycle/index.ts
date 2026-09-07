import cron from "node-cron";
import { prisma } from "@repo/db";
import { redis } from "@repo/redis";
import { producer } from "../../shared/config/kafka/kafkaClient.js";
import { KAFKA_TOPICS } from "../../shared/config/kafka.js";

const WARNING_LOCK_KEY = "cron:domain-warning:lock";
const WARNING_LOCK_TTL_SECONDS = 23 * 60 * 60; // ~23h — self-expiring, keeps this to ~once/day
const WARNING_WINDOW_DAYS = 2;

// ── Expiry: deactivate anything past endsAt, runs every tick ───────────────
// Naturally idempotent — once a domain is DEACTIVATED it drops out of the
// `state: ACTIVE` filter, so re-running this on downtime recovery is safe.
async function runExpiryCheck() {
  const now = new Date();

  const expiredDomains = await prisma.domain.findMany({
    where: {
      state: "ACTIVE",
      endsAt: { lt: now },
      deletedAt: null,
    },
    select: { id: true, endsAt: true },
  });

  if (expiredDomains.length === 0) return;

  console.log(`DOMAIN LIFECYCLE CRON: Expiring ${expiredDomains.length} domain(s)`);

  for (const domain of expiredDomains) {
    try {
      const deactivated = await prisma.domain.updateMany({
        where: {
          id: domain.id,
          state: "ACTIVE",
          endsAt: { lt: now },
          deletedAt: null,
        },
        data: { state: "DEACTIVATED" },
      });

      // A payment may have renewed the domain after the initial query.
      if (deactivated.count === 0) continue;

      await producer.send({
        topic: KAFKA_TOPICS.NOTIFICATIONS,
        messages: [
          {
            key: domain.id,
            value: JSON.stringify({
              domainId: domain.id,
              type: "DOMAIN_EXPIRED",
              endsAt: domain.endsAt.toISOString(),
            }),
          },
        ],
      });
    } catch (error) {
      console.error(`DOMAIN LIFECYCLE CRON: Failed to expire domain ${domain.id}:`, error);
    }
  }
}

// ── Warning: gated to ~once/day via redis lock, cron tick frequency doesn't matter ──
async function runWarningCheck() {
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

export async function startDomainLifecycleJob() {
  cron.schedule("0 * * * *", async () => {
    await runExpiryCheck();
    await runWarningCheck();
  });

  console.log(
    "DOMAIN LIFECYCLE CRON: scheduled (hourly tick; expiry runs every tick, warning gated to ~once/day via redis lock)"
  );
}