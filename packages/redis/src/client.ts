//apps/packages/redis/src/client.ts

import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}