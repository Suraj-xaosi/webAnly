// src/modules/collector/collector.service.ts
import { producer }               from "../../kafka/kafkaClient";
import { apikeyChecker }          from "../../functions/apikeyChecker";
import { KAFKA_TOPICS }           from "../../config/kafka";
import parseTime                  from "./functions/parseTimeSpent";
import parseDate                  from "./functions/parseDate";
import { extractRealIp }          from "./functions/extractIP";
import countryFromIp              from "./functions/countryFromIp";
import { Request }                from "express";
import { extractReferrerHostname } from "./functions/extractReferrerHostname";
import {normalizePath} from "./functions/normalizepath";
import { isOriginAllowed } from "./functions/checkOrigin";
import { createHash }  from "crypto";

const VALID_EXIT_TYPES = new Set(["navigation", "pagehide", "hidden"]);

function parseExitType(exitType: any): string | null {
  return typeof exitType === "string" && VALID_EXIT_TYPES.has(exitType) ? exitType : null;
}
function hashVisitorId(visitorId: string): string {
  return createHash("sha256").update(visitorId).digest("hex");
}

export async function handleCollectEvent(req: Request) {
  const body = req.body || {};

  const domain = await apikeyChecker(body.apikey);
  if (!domain.isActive) return;
    const allowed = isOriginAllowed(
    req.headers.origin as string | undefined,
    req.headers.referer as string | undefined,
    domain.domainName
  );

  if (!allowed) {
    console.warn(`Collector: origin mismatch for domain ${domain.domainName}`);
     // letting it pass here for now .
  }
  
  const visitorID = extractRealIp(req.ip || "");
  const visitedAt = parseDate(body.visitedAt) || new Date();
  const timeSpent = parseTime(body.timeSpent);
  const exitType  = parseExitType(body.exitType);
  const referrer  = extractReferrerHostname(body.referrer);
 const page = normalizePath(body.page);
  let country = "unknown";
  try {
    country = visitorID ? await countryFromIp(visitorID) : "unknown";
  } catch {
    country = "unknown";
  }

  let eventData = {
    domainId: domain.domainId,
    domainName: domain.domainName,
    visitorId: hashVisitorId(visitorID),
    pageTitle: body.pageTitle || null,
    page,
    referrer,
    browser: body.browser || "Unknown",
    device: body.device || "Unknown",
    os: body.os || "Unknown",
    timezone: body.timezone || "Unknown",
    country,
    exitType,
    timeSpent,
    visitedAt,
  };

  await producer.send({
    topic: KAFKA_TOPICS.SITE_EVENTS,
    messages: [{ key: domain.domainId, value: JSON.stringify(eventData) }],
  });

  

  if(exitType != "hidden") {
    if (domain.ispro){
      let socketEventData = {
         ...eventData,  
        timezone: domain.defaultTimezone,
      };
      await producer.send({
        topic: KAFKA_TOPICS.SOCKET_EVENTS,
        messages: [{ key: domain.domainId, value: JSON.stringify(socketEventData) }],
      });
    }
  }
}