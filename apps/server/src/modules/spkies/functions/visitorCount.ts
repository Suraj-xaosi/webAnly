// src/modules/spikes/functions/visitorCount.ts
import { prisma } from "@repo/db";

export default async function visitorCount(domainId: string): Promise<number> {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const result = await prisma.pageVisit.findMany({
      where: {
        domainId,
        visitedAt: { gte: fiveMinutesAgo },
      },
      select:   { visitorId: true },
      distinct: ["visitorId"],
    });

    return result.length;

  } catch (error) {
    console.error(`Failed to get visitor count for domain ${domainId}:`, error);
    throw error;
  }
}