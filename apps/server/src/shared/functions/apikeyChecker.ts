import { prisma } from "@repo/db";
import { deleteCache, getCache, setCache } from "@repo/redis";

export interface DomainInfo {
  domainId: string;
  domainName: string;
  state: "ACTIVE" | "DEACTIVATED";
  type: "FREE" | "PAID";
  defaultTimezone: string;
}

const CACHE_TTL_SECONDS = 1200; // redis TTL, 20 min

export async function invalidateApikeyCache(apikey: string): Promise<void> {
  const cacheKey = `apikey:${apikey.trim()}`;
  await deleteCache(cacheKey);
}

export async function apikeyChecker(apikey: string): Promise<DomainInfo> {
  const normalizedApiKey = typeof apikey === "string" ? apikey.trim() : "";
  if (!normalizedApiKey) throw new Error("Invalid API key format");

  const cacheKey = `apikey:${normalizedApiKey}`;


  try {
    const cached = await getCache<DomainInfo>(cacheKey);
    if (cached) {
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

  try {
    await setCache(cacheKey, result, CACHE_TTL_SECONDS);
  } catch (error) {
    console.warn("API key cache write failed", error);
  }

  return result;
}