import { prisma } from "@repo/db";
import { createHttpError } from "../errors.js";

export interface DomainInfo {
  domainId: string;
  domainName: string;
  state: "ACTIVE" | "DEACTIVATED";
  type: "FREE" | "PAID";
  defaultTimezone: string;
}

export async function apikeyChecker(apikey: string): Promise<DomainInfo> {
  const normalizedApiKey = typeof apikey === "string" ? apikey.trim() : "";
  if (!normalizedApiKey) {
    throw createHttpError(401, "Invalid API key.", "INVALID_API_KEY");
  }

  let domain;
  try {
    domain = await prisma.domain.findUnique({
      where: { apikey: normalizedApiKey },
      select: { id: true, domainName: true, state: true, type: true, defaultTimezone: true },
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
    type: domain.type,
    defaultTimezone: domain.defaultTimezone,
  };

  return result;
}