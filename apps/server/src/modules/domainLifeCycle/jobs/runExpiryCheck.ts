import { prisma } from "@repo/db";
import { KAFKA_TOPICS } from "../../../shared/config/kafka.js";
import { producer } from "../../../shared/config/kafka/kafkaClient.js";

export  async function runExpiryCheck() {
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