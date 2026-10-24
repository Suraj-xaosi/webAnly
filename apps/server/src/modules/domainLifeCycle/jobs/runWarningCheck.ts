import { prisma } from "@repo/db";
import { createNotification } from "../../notifications/createNotification.js";

const WARNING_WINDOW_DAYS = 2;

export async function runWarningCheck() {
  const now = Date.now();
  const windowEnd = new Date(now + WARNING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const expiringDomains = await prisma.domain.findMany({
    where: {
      state: "ACTIVE",
      endsAt: { gte: new Date(now), lte: windowEnd },
      deletedAt: null,
    },
    select: { id: true, endsAt: true, userId: true },
  });

  if (expiringDomains.length === 0) return;

  console.log(`DOMAIN LIFECYCLE CRON: Warning ${expiringDomains.length} domain(s) of upcoming expiry`);

  for (const domain of expiringDomains) {
    try {
      const existing = await prisma.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT 1 FROM "notification"
          WHERE "userId" = ${domain.userId}
            AND "type" = 'DOMAIN_EXPIRING'
            AND "createdAt" >= ${new Date(now - 24 * 60 * 60 * 1000)}
            AND "data"->>'domainId' = ${domain.id}
        ) AS exists
      `;
      if (existing[0]?.exists) continue;

      await createNotification({
        domainId: domain.id,
        type: "DOMAIN_EXPIRING",
        endsAt: domain.endsAt.toISOString(),
      });
    } catch (error) {
      console.error(`DOMAIN LIFECYCLE CRON: Failed to store expiry warning for domain ${domain.id}:`, error);
    }
  }
}