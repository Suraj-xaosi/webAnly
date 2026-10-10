import { producer }                    from "../../shared/config/kafka/kafkaClient.js";
import { apikeyChecker }               from "../../shared/functions/apikeyChecker.js";
import { KAFKA_TOPICS }                from "../../shared/config/kafka.js";
import parseTime                       from "./functions/parseTimeSpent.js";
import parseDate                       from "./functions/parseDate.js";
import { extractRealIp }               from "./functions/extractIP.js";
import { locationFromIp }              from "./functions/countryFromIp.js";
import { Request }                     from "express";
import { extractReferrerHostname }     from "./functions/extractReferrerHostname.js";
import { normalizePath }               from "./functions/normalizepath.js";
import { isOriginAllowed }             from "./functions/checkOrigin.js";
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

  await producer.send({
    topic: KAFKA_TOPICS.SITE_EVENTS,
    messages: [{ key: domain.domainId, value: JSON.stringify(eventData) }],
  });

  const socketEventData = {
    ...eventData,
    defaultTimezone: domain.defaultTimezone,
  };

  await producer.send({
    topic: KAFKA_TOPICS.SOCKET_EVENTS,
    messages: [{ key: domain.domainId, value: JSON.stringify(socketEventData) }],
  });

  return null;
}