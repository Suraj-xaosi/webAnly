
import { prisma }        from "@repo/db";
import visitorCount      from "./functions/visitorCount.js"; 

const GROWTH_FACTOR = 1.10;
const DECAY_FACTOR  = 0.90;
const MIN_EXPECTED  = 1;

export default async function spikeCheck(domainId: string) {
  try {
    const domain = await prisma.domain.findUnique({ where: { id: domainId } });

    if (!domain) {
      console.log(` SPIKE CHECK WORKER :  Domain not found: ${domainId}`);
      return;
    }
    if (domain.expectedVisitors === null || domain.expectedVisitors === undefined) {
      console.log(`SPIKE CHECK WORKER : ⚠ expectedVisitors not set for domain: ${domainId}`);
      return;
    }

    const expected = domain.expectedVisitors;
    const countIn5min = await visitorCount(domainId);

    let newExpected = expected;

    if (countIn5min > expected) {
      const difference = countIn5min - expected;
      const spikeDate = new Date();

      await prisma.notification.create({
        data: {
          userId: domain.userId,
          type: "SPIKE_ALERT",
          title: `Traffic spike on ${domain.domainName}`,
          message: `Got ${countIn5min} visitors, above the expected ${expected}.`,
          data: {
            domainId,
            domainName: domain.domainName,
            visitorCountIn5min: countIn5min,
            expectedVisitors: expected,
            difference,
            spikeDate: spikeDate.toISOString(),
          },
        },
      });

      newExpected = Math.max(MIN_EXPECTED, Math.ceil(expected * GROWTH_FACTOR));
      console.log(`SPIKE CHECK WORKER :  Spike: ${domainId} | got ${countIn5min} | expected ${expected} → raising to ${newExpected}`);

    } else if (countIn5min < expected * DECAY_FACTOR) {
      newExpected = Math.max(MIN_EXPECTED, Math.floor(expected * DECAY_FACTOR));
      console.log(`SPIKE CHECK WORKER :  Quiet: ${domainId} | got ${countIn5min} | expected ${expected} → lowering to ${newExpected}`);
    }

    if (newExpected !== expected) {
      await prisma.domain.update({
        where: { id: domainId },
        data: { expectedVisitors: newExpected },
      });
    }
  } catch (error) {
    console.error(`SPIKE CHECK WORKER : spikeCheck failed for ${domainId}:`, error);
  }
}