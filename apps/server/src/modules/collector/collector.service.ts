// src/modules/collector/collector.service.ts
import { producer }               from "../../kafka/kafkaClient";
import { apikeyChecker }          from "../../functions/apikeyChecker";
import { KAFKA_TOPICS }           from "../../config/kafka";
import parseTime                  from "./functions/parseTimeSpent";
import parseDate                  from "./functions/parseDate";
import { extractRealIp }          from "./functions/extractIP";
import countryFromIp              from "../eventDumping/functions/countryFromIp";
import { Request }                from "express";

export async function handleCollectEvent(req: Request) {
  const body = req.body || {};

  const domain = await apikeyChecker(body.apikey);
  if (!domain.isActive) throw new Error("DOMAIN_INACTIVE");

  const visitorID = extractRealIp(req.ip || "");
  const visitedAt = parseDate(body.visitedAt) || new Date();
  const timeSpent = parseTime(body.timeSpent);

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
    referrer: body.referrer || null,
    browser: body.browser || "Unknown",
    device: body.device || "Unknown",
    os: body.os || "Unknown",
    timezone: body.timezone || "Unknown",
    country,
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