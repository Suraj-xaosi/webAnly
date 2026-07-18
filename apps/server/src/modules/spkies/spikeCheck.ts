// src/modules/spikes/functions/spikeCheck.ts
import { prisma }        from "@repo/db";
import { producer }      from "../../kafka/kafkaClient";
import { KAFKA_TOPICS }  from "../../config/kafka";
import visitorCount      from "./functions/visitorCount"; // fixed path

const GROWTH_FACTOR = 1.10;
const DECAY_FACTOR  = 0.90;
const MIN_EXPECTED  = 1;

export default async function spikeCheck(domainId: string) {
  try {
    const domain = await prisma.domain.findUnique({ where: { id: domainId } });

    if (!domain) {
      console.log(`❌ Domain not found: ${domainId}`);
      return;
    }
    if (domain.expectedVisitors === null || domain.expectedVisitors === undefined) {
      console.log(`⚠ expectedVisitors not set for domain: ${domainId}`);
      return;
    }

    const expected = domain.expectedVisitors;
    const countIn5min = await visitorCount(domainId);

    let newExpected = expected;

    if (countIn5min > expected) {
      const difference = countIn5min - expected;

      await producer.send({
        topic: KAFKA_TOPICS.NOTIFICATIONS,
        messages: [
          {
            key: domainId,
            value: JSON.stringify({
              domainId,
              visitorCountIn5min: countIn5min,
              expectedVisitors: expected,
              difference,
              type: "SPIKE_ALERT",
              spikeDate: new Date().toISOString(), // explicit, since JSON.stringify would do this anyway
            }),
          },
        ],
      });

      newExpected = Math.max(MIN_EXPECTED, Math.ceil(expected * GROWTH_FACTOR));
      console.log(`🚨 Spike: ${domainId} | got ${countIn5min} | expected ${expected} → raising to ${newExpected}`);

    } else if (countIn5min < expected * DECAY_FACTOR) {
      newExpected = Math.max(MIN_EXPECTED, Math.floor(expected * DECAY_FACTOR));
      console.log(`📉 Quiet: ${domainId} | got ${countIn5min} | expected ${expected} → lowering to ${newExpected}`);
    }

    if (newExpected !== expected) {
      await prisma.domain.update({
        where: { id: domainId },
        data: { expectedVisitors: newExpected },
      });
    }
  } catch (error) {
    console.error(`❌ spikeCheck failed for ${domainId}:`, error);
  }
}