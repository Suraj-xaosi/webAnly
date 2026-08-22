
import { producer }               from "../../shared/config/kafka/kafkaClient.js";
import { apikeyChecker }          from "../../shared/functions/apikeyChecker.js"
import { KAFKA_TOPICS }           from "../../shared/config/kafka.js";
import parseTime                  from "./functions/parseTimeSpent.js";
import parseDate                  from "./functions/parseDate.js";
import { extractRealIp }          from "./functions/extractIP.js";
import countryFromIp              from "./functions/countryFromIp.js";
import { Request }                from "express";
import { extractReferrerHostname } from "./functions/extractReferrerHostname.js";
import {normalizePath} from "./functions/normalizepath.js";
import { isOriginAllowed } from "./functions/checkOrigin.js";
import { createHash }  from "crypto";
import { checkVisitorNewness } from "./functions/trackVisitor.js";

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
  if (!domain.isActive){
    console.log(`COLLECTOR : this ${domain.domainName} is inactive`);
    return;
  };

  const allowed = isOriginAllowed(
    req.headers.origin as string | undefined,
    req.headers.referer as string | undefined,
    domain.domainName
  );

  if (!allowed) {
    console.warn(`Collector: origin mismatch for domain ${domain.domainName}`);
     // letting it pass here for now becaouse I do not have domain verification yet .
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
      const { isNewVisitor, isNewVisitorToday, isNewVisitorFor } = await checkVisitorNewness(
            eventData.domainId,
            eventData.visitorId,
            domain.defaultTimezone,
            {
              page: eventData.page,
              referrer: eventData.referrer,
              browser: eventData.browser,
              os: eventData.os,
              device: eventData.device,
              country: eventData.country,
            }
          );
      let socketEventData = {
         ...eventData,  
         isNewVisitor,
         isNewVisitorFor,
         isNewVisitorToday
      };
      await producer.send({
        topic: KAFKA_TOPICS.SOCKET_EVENTS,
        messages: [{ key: domain.domainId, value: JSON.stringify(socketEventData) }],
      });
    }
  }
}