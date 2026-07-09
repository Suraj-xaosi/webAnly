//server/src/functions/apikeyChecker.ts
import { prisma } from "@repo/db";

interface DomainInfo {
  domainId:   string;
  domainName: string;
  isActive:   boolean;

}

const apiKeyCache = new Map<string, DomainInfo>();

export async function apikeyChecker(apikey: string){
  if (!apikey || typeof apikey !== "string") {
    throw new Error("Invalid API key format");
  }

  const cached = apiKeyCache.get(apikey);
  if (cached) return cached;

  let domain;
  try {
    domain = await prisma.domain.findUnique({
      where:  { apikey },
      select: {
        id:         true,
        domainName: true,
        isActive:   true,
        
      },
    });
  } catch (err) {
    throw new Error("Failed to reach database");
  }

  if (!domain) {
    throw new Error("Invalid API key");
  }

  const result: DomainInfo = {
    domainId:   domain.id,
    domainName: domain.domainName,
    isActive: domain.isActive,
  };

  apiKeyCache.set(apikey, result);

  return result;
}