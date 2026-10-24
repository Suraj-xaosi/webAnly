import { apikeyChecker }               from "../../shared/functions/apikeyChecker.js";
import { prisma }                      from "@repo/db";
import parseTime                       from "./functions/parseTimeSpent.js";
import parseDate                       from "./functions/parseDate.js";
import { extractRealIp }               from "./functions/extractIP.js";
import { locationFromIp }              from "./functions/countryFromIp.js";
import { Request }                     from "express";
import { extractReferrerHostname }     from "./functions/extractReferrerHostname.js";
import { normalizePath }               from "./functions/normalizepath.js";
import { isOriginAllowed }             from "./functions/checkOrigin.js";
import { broadcastDomainEvent }         from "../websocket/websocket.broadcast.js";
import { checkVisitorNewness }          from "../websocket/functions/trackVisitor.js";
import {
  checkCollectorIpRateLimit,
  checkCollectorRateLimit,
  type CollectorRateLimitResult,
} from "./functions/collectorRateLimiter.js";
import type { CollectorEventInput } from "@repo/types/validation";

const VALID_EXIT_TYPES = new Set(["navigation", "pagehide", "hidden"]);

function parseExitType(exitType: unknown): string | null {
  return typeof exitType === "string" && VALID_EXIT_TYPES.has(exitType) ? exitType : null;
}

function parsePreviousPage(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/")) return null;
  return normalizePath(value.slice(0, 500));
}

export async function handleCollectEvent(
  req: Request,
  body: CollectorEventInput
): Promise<CollectorRateLimitResult | null> {
  const visitorIP = extractRealIp(req.ip || req.socket.remoteAddress || "");

  const ipRateLimit = await checkCollectorIpRateLimit(visitorIP);
  if (ipRateLimit) return ipRateLimit;

  const exitType = parseExitType(body.exitType);

  if (exitType === "hidden") {
    return null;
  }

  const domain = await apikeyChecker(body.apikey);

  const allowed = isOriginAllowed(
    req.headers.origin as string | undefined,
    req.headers.referer as string | undefined,
    domain.domainName
  );

  if (!allowed) {
    console.warn(`Collector: origin mismatch for domain ${domain.domainName}`);
    return null;
  }

  const apiKeyRateLimit = await checkCollectorRateLimit(body.apikey);
  if (apiKeyRateLimit) return apiKeyRateLimit;

  const visitedAt = parseDate(body.visitedAt);
  const timeSpent = parseTime(body.timeSpent);
  const page      = normalizePath(body.page);

  const previousPage = parsePreviousPage(body.previousPage);
  const referrer     = previousPage ? null : extractReferrerHostname(body.referrer);

  const { country, city } = visitorIP
    ? await locationFromIp(visitorIP)
    : { country: "unknown", city: "unknown" };

  const eventData = {
    domainId:   domain.domainId,
    domainName: domain.domainName,
    visitorId:  body.visitorId,
    pageTitle:  body.pageTitle || null,
    page,
    referrer,
    previousPage,
    browser:    body.browser  || "Unknown",
    device:     body.device   || "Unknown",
    os:         body.os       || "Unknown",
    timezone:   body.timezone || "Unknown",
    country,
    city,
    exitType,
    timeSpent,
    visitedAt,
  };

  const visitorNewness = await checkVisitorNewness(
    domain.domainId,
    eventData.visitorId,
    domain.defaultTimezone || eventData.timezone || "UTC",
    eventData.visitedAt,
    eventData
  );

  await prisma.pageVisit.create({
    data: {
      ...eventData,
      pageTitle: eventData.pageTitle ?? "unknown",
      referrer: eventData.referrer,
      previousPage: eventData.previousPage,
      country: eventData.country,
      city: eventData.city,
      browser: eventData.browser,
      device: eventData.device,
      os: eventData.os,
      timezone: eventData.timezone,
      exitType: eventData.exitType,
      timeSpent: eventData.timeSpent,
    },
  });

  broadcastDomainEvent(domain.domainId, {
    ...eventData,
    defaultTimezone: domain.defaultTimezone,
    ...visitorNewness,
  });

  return null;
}