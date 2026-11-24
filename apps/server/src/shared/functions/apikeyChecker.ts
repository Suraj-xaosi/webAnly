import { prisma } from "@repo/db";
import { createHttpError } from "../errors.js";
import { LRUCache } from "lru-cache";

export interface DomainInfo {
  domainId: string;
  domainName: string;
  state: "ACTIVE" | "DEACTIVATED";
  defaultTimezone: string;
}

const CACHE_TTL_MS = 20 * 60 * 1000;
const apikeyCache = new LRUCache<string, DomainInfo>({
  max: 5_000,
  ttl: CACHE_TTL_MS,
  updateAgeOnGet: false,
});

export async function invalidateApikeyCache(apikey: string): Promise<void> {
  apikeyCache.delete(apikey.trim());
}

export async function apikeyChecker(apikey: string): Promise<DomainInfo> {
  const normalizedApiKey = typeof apikey === "string" ? apikey.trim() : "";
  if (!normalizedApiKey) {
    throw createHttpError(401, "Invalid API key.", "INVALID_API_KEY");
  }

  const cached = apikeyCache.get(normalizedApiKey);
  if (cached) {
    if (cached.state !== "ACTIVE") {
      throw createHttpError(403, "Domain is inactive.", "DOMAIN_INACTIVE");
    }
    return cached;
  }

  let domain;
  try {
    domain = await prisma.domain.findUnique({
      where: { apikey: normalizedApiKey },
      select: { id: true, domainName: true, state: true, defaultTimezone: true },
    });
  } catch (error) {
    console.error("Failed to reach database while checking API key", error);
    throw createHttpError(503, "Unable to validate API key.", "API_KEY_LOOKUP_FAILED");
  }

  if (!domain) {
    throw createHttpError(401, "Invalid API key.", "INVALID_API_KEY");
  }
  if (domain.state !== "ACTIVE") {
    throw createHttpError(403, "Domain is inactive.", "DOMAIN_INACTIVE");
  }

  const result: DomainInfo = {
    domainId: domain.id,
    domainName: domain.domainName,
    state: domain.state,
    defaultTimezone: domain.defaultTimezone,
  };

  apikeyCache.set(normalizedApiKey, result);

  return result;
}