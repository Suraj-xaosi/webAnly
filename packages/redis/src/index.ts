import { redis } from "./client.js";

export { redis } ;

export async function getCache<T>(key: string): Promise<T | null> {
  const val = await redis.get(key);
  return val ? (JSON.parse(val) as T) : null;
}

export async function setCache(key: string, value: unknown, ttlSeconds: number) {
  if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0) {
    throw new RangeError("Cache TTL must be a positive integer.");
  }

  const str = JSON.stringify(value);
  await redis.set(key, str, "EX", ttlSeconds);
}

export async function deleteCache(key: string) {
  await redis.del(key);
}