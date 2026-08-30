import cron from "node-cron";
import spikeCheck from "./spikeCheck.js";
import { redis } from "@repo/redis";
import { DOMAIN_ACTIVITY_SET_KEY } from "../../shared/config/rediskeys.js";

const PROCESSING_KEY = `${DOMAIN_ACTIVITY_SET_KEY}:processing`;

export async function startSpikeJob() {
  cron.schedule("*/5 * * * *", async () => {

  const merged = await redis.sunionstore(PROCESSING_KEY, PROCESSING_KEY, DOMAIN_ACTIVITY_SET_KEY);
  await redis.del(DOMAIN_ACTIVITY_SET_KEY);

  if (merged === 0) return; 

  const domains = await redis.smembers(PROCESSING_KEY);
  await redis.del(PROCESSING_KEY);

  if (domains.length === 0) return;

  console.log(
    ` SPIKE CHECK WORKER : Running spike check for ${domains.length} domain(s)`
  );
  await Promise.all(domains.map((domainId) => spikeCheck(domainId)));
});

  console.log("SPIKE CHECK WORKER: Spike job scheduled (every 5 min)");
}