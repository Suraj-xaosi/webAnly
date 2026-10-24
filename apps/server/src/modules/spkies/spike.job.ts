import cron from "node-cron";
import spikeCheck from "./spikeCheck.js";
import { prisma } from "@repo/db";

export async function startSpikeJob() {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const domains = await prisma.pageVisit.findMany({
        where: { visitedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
        distinct: ["domainId"],
        select: { domainId: true },
      });

      if (domains.length === 0) return;
      console.log(`SPIKE CHECK WORKER: Checking ${domains.length} active domain(s)`);
      await Promise.all(domains.map(({ domainId }) => spikeCheck(domainId)));
    } catch (error) {
      console.error("SPIKE CHECK WORKER: Scheduled check failed", error);
    }
  });
  console.log("SPIKE CHECK WORKER: Spike job scheduled (every 5 min)");
}