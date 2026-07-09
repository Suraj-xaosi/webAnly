// src/modules/spikes/functions/spikeCheck.ts
import { prisma }        from "@repo/db";
import { producer }      from "../../kafka/kafkaClient";
import { KAFKA_TOPICS }  from "../../config/kafka";
import visitorCount      from "./functions/visitorCount";

export default async function spikeCheck(domainId: string) {
  try {
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
    });

    if (!domain) {
      console.log(`❌ Domain not found: ${domainId}`);
      return;
    }

    // fixed: !domain.expectedVisitors === undefined is always true
    if (domain.expectedVisitors === null || domain.expectedVisitors === undefined) {
      console.log(`⚠ expectedVisitors not set for domain: ${domainId}`);
      return;
    }

    const countIn5min = await visitorCount(domainId);

    if (countIn5min >= domain.expectedVisitors) {
      const difference = countIn5min - domain.expectedVisitors;

      await producer.send({
        topic: KAFKA_TOPICS.NOTIFICATIONS,
        messages: [
          {
            key: domainId,
            value: JSON.stringify({
              domainId,
              visitorCountIn5min: countIn5min,
              expectedVisitors: domain.expectedVisitors,
              difference,
            }),
          },
        ],
      });

      console.log(
        `🚨 Spike: ${domainId} | got ${countIn5min} | expected ${domain.expectedVisitors} | diff ${difference}`
      );
    }

    await prisma.domain.update({
      where: { id: domainId },
      data: { expectedVisitors: countIn5min },
    });
  } catch (error) {
    console.error(`❌ spikeCheck failed for ${domainId}:`, error);
  }
}