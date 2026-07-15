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

const VALID_EXIT_TYPES = new Set(["navigation", "pagehide", "hidden"]);

function parseExitType(exitType: any): string | null {
  return typeof exitType === "string" && VALID_EXIT_TYPES.has(exitType) ? exitType : null;
}

export async function handleCollectEvent(req: Request) {
  const body = req.body || {};

  const domain = await apikeyChecker(body.apikey);
  if (!domain.isActive) throw new Error("DOMAIN_INACTIVE");

  const visitorID = extractRealIp(req.ip || "");
  const visitedAt = parseDate(body.visitedAt) || new Date();
  const timeSpent = parseTime(body.timeSpent);
  const exitType  = parseExitType(body.exitType);
  const referrer  = extractReferrerHostname(body.referrer);

  let country = "unknown";
  try {
    country = visitorID ? await countryFromIp(visitorID) : "unknown";
  } catch {
    country = "unknown";
  }

  const eventData = {
    domainId: domain.domainId,
    domainName: domain.domainName,
    visitorId: visitorID,
    pageTitle: body.pageTitle || null,
    page: body.page,
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

  await producer.send({
    topic: KAFKA_TOPICS.SOCKET_EVENTS,
    messages: [{ key: domain.domainId, value: JSON.stringify(eventData) }],
  });
}