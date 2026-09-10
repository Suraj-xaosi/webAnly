import { prisma } from "@repo/db";
import { getCache, setCache } from "@repo/redis";
import { LRUCache } from "lru-cache";

export interface DomainInfo {
  domainId: string;
  domainName: string;
  state: "ACTIVE" | "DEACTIVATED";
  type: "FREE" | "PAID";
  defaultTimezone: string;
}

const CACHE_TTL_SECONDS = 1200; // redis TTL, 20 min
const LOCAL_TTL_MS = 15_000;    // in-memory TTL, 15s — tune this

const localCache = new LRUCache<string, DomainInfo>({
  max: 5000,           // cap memory use; tune to your active-domain count
  ttl: LOCAL_TTL_MS,
});

export async function apikeyChecker(apikey: string): Promise<DomainInfo> {
  const normalizedApiKey = typeof apikey === "string" ? apikey.trim() : "";
  if (!normalizedApiKey) throw new Error("Invalid API key format");

  const cacheKey = `apikey:${normalizedApiKey}`;

  // L1: in-process, zero network cost
  const local = localCache.get(cacheKey);
  if (local) {
    if (local.state !== "ACTIVE") throw new Error("Domain is inactive");
    return local;
  }

  // L2: redis
  try {
    const cached = await getCache<DomainInfo>(cacheKey);
    if (cached) {
      localCache.set(cacheKey, cached);
      if (cached.state !== "ACTIVE") throw new Error("Domain is inactive");
      return cached;
    }
  } catch (error) {
    console.warn("API key cache lookup failed", error);
  }

  // L3: db
  let domain;
  try {
    domain = await prisma.domain.findUnique({
      where: { apikey: normalizedApiKey },
      select: { id: true, domainName: true, state: true, type: true, defaultTimezone: true },
    });
  } catch (error) {
    console.error("Failed to reach database while checking API key", error);
    throw new Error("Failed to reach database");
  }

  if (!domain) throw new Error("Invalid API key");
  if (domain.state !== "ACTIVE") throw new Error("Domain is inactive");

  const result: DomainInfo = {
    domainId: domain.id,
    domainName: domain.domainName,
    state: domain.state,
    type: domain.type,
    defaultTimezone: domain.defaultTimezone,
  };

  localCache.set(cacheKey, result);
  try {
    await setCache(cacheKey, result, CACHE_TTL_SECONDS);
  } catch (error) {
    console.warn("API key cache write failed", error);
  }

  return result;
}