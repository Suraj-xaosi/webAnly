import { producer }                    from "../../shared/config/kafka/kafkaClient.js";
import { DomainInfo, apikeyChecker }   from "../../shared/functions/apikeyChecker.js";
import { KAFKA_TOPICS }                from "../../shared/config/kafka.js";
import parseTime                       from "./functions/parseTimeSpent.js";
import parseDate                       from "./functions/parseDate.js";
import { extractRealIp }               from "./functions/extractIP.js";
import { locationFromIp }              from "./functions/countryFromIp.js";
import { Request }                     from "express";
import { extractReferrerHostname }     from "./functions/extractReferrerHostname.js";
import { normalizePath }               from "./functions/normalizepath.js";
import { isOriginAllowed }             from "./functions/checkOrigin.js";
import { createHash }                  from "crypto";

const VALID_EXIT_TYPES = new Set(["navigation", "pagehide", "hidden"]);

function parseExitType(exitType: any): string | null {
  return typeof exitType === "string" && VALID_EXIT_TYPES.has(exitType) ? exitType : null;
}

function hashVisitorId(visitorId: string): string {
  return createHash("sha256").update(visitorId).digest("hex");
}

// previousPage must be a path on the same site (starts with "/"). Anything else is ignored.
function parsePreviousPage(value: any): string | null {
  if (typeof value !== "string" || !value.startsWith("/")) return null;
  return normalizePath(value.slice(0, 500));
}

export async function handleCollectEvent(req: Request) {
  const body = req.body || {};
  const exitType = parseExitType(body.exitType);

  // "hidden" is not a real event, just a signal that the tab was hidden. Do not send it to Kafka.
  if (exitType === "hidden") {
    return;
  }

  let domain: DomainInfo;
  try {
    domain = await apikeyChecker(body.apikey);
  } catch (err) {
    console.warn(`COLLECTOR: apikey check failed`, err);
    return;
  }

  if (domain.state !== "ACTIVE") {
    console.log(`COLLECTOR : this ${domain.domainName} is inactive`);
    return;
  }

  const allowed = isOriginAllowed(
    req.headers.origin as string | undefined,
    req.headers.referer as string | undefined,
    domain.domainName
  );

  if (!allowed) {
    console.warn(`Collector: origin mismatch for domain ${domain.domainName}`);
    // letting it pass here for now because I do not have domain verification yet. this is a to-do
  }

  const visitorID = extractRealIp(req.ip || "");
  const visitedAt = parseDate(body.visitedAt) || new Date();
  const timeSpent = parseTime(body.timeSpent);
  const page      = normalizePath(body.page);

  // previousPage set  → internal navigation, so there is no external referrer (null)
  // previousPage null → arrived from outside or directly, so the referrer is a hostname or "direct"
  const previousPage = parsePreviousPage(body.previousPage);
  const referrer     = previousPage ? null : extractReferrerHostname(body.referrer);

  const { country, city } = visitorID
    ? await locationFromIp(visitorID)
    : { country: "unknown", city: "unknown" };

  const eventData = {
    domainId:   domain.domainId,
    domainName: domain.domainName,
    visitorId:  hashVisitorId(visitorID),
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
}