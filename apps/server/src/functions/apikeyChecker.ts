// server/src/functions/apikeyChecker.ts
import { prisma } from "@repo/db";
import { getCache, setCache } from "@repo/redis";

interface DomainInfo {
  domainId: string;
  domainName: string;
  isActive: boolean;
  ispro: boolean;
  defaultTimezone: string;
}

const CACHE_TTL_SECONDS = 1200; // 20 minutes

export async function apikeyChecker(apikey: string) {
  const normalizedApiKey = typeof apikey === "string" ? apikey.trim() : "";

  if (!normalizedApiKey) {
    throw new Error("Invalid API key format");
  }

  const cacheKey = `apikey:${normalizedApiKey}`;

  try {
    const cached = await getCache<DomainInfo>(cacheKey);
    if (cached) {
      if (!cached.isActive) {
        throw new Error("Domain is inactive");
      }

      return cached;
    }
  } catch (error) {
    console.warn("API key cache lookup failed", error);
  }

  let domain;
  try {
    domain = await prisma.domain.findUnique({
      where: { apikey: normalizedApiKey },
      select: {
        id: true,
        domainName: true,
        isActive: true,
        pro: true,
        defaultTimezone: true,
      },
    });
  } catch (error) {
    console.error("Failed to reach database while checking API key", error);
    throw new Error("Failed to reach database");
  }

  if (!domain) {
    throw new Error("Invalid API key");
  }

  if (!domain.isActive) {
    throw new Error("Domain is inactive");
  }

  const result: DomainInfo = {
    domainId: domain.id,
    domainName: domain.domainName,
    isActive: domain.isActive,
    ispro: domain.pro,
    defaultTimezone: domain.defaultTimezone,
  };

  try {
    await setCache(cacheKey, result, CACHE_TTL_SECONDS);
  } catch (error) {
    console.warn("API key cache write failed", error);
  }

  return result;
}