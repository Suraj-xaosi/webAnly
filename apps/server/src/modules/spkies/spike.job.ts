import cron from "node-cron";
import spikeCheck from "./spikeCheck.js";
import { prisma } from "@repo/db";

export async function startSpikeJob() {
  cron.schedule("*/5 * * * *", async () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeDomains = await prisma.pageVisit.groupBy({
      by: ["domainId"],
      where: {
        visitedAt: { gte: fiveMinutesAgo },
      },
    });
    const domainIds = activeDomains.map(({ domainId }) => domainId);

    if (domainIds.length === 0) return;

    console.log(
      `SPIKE CHECK WORKER: Running spike check for ${domainIds.length} domain(s)`
    );
    await Promise.all(domainIds.map((domainId) => spikeCheck(domainId)));
  });
  console.log("SPIKE CHECK WORKER: Spike job scheduled (every 5 min)");
}