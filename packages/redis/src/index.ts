//apps/packages/redis/src/index.ts
import { redis } from "./client";

export { redis } ;

export async function getCache<T>(key: string): Promise<T | null> {
  const val = await redis.get(key);
  return val ? (JSON.parse(val) as T) : null;
}

export async function setCache(key: string, value: unknown, ttlSeconds?: number) {
  const str = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.set(key, str, "EX", ttlSeconds);
  } else {
    await redis.set(key, str);
  }
}

export async function deleteCache(key: string) {
  await redis.del(key);
}