// src/modules/eventDumping/functions/dumpInDB.ts
import { prisma }      from "@repo/db";
import { createHash }  from "crypto";

function hashVisitorId(visitorId: string): string {
  return createHash("sha256").update(visitorId).digest("hex");
}

type EventData = {
  domainId:   string;
  domainName: string;
  visitorId:  string;
  page:       string;
  visitedAt:  Date;
  pageTitle?: string;
  referrer?:  string;
  country?:   string;
  browser?:   string;
  device?:    string;
  os?:        string;
  timezone?:  string;
  exitType?:  string | null;
  timeSpent?: number;
};

export default async function dumpInDB(eventData: EventData) {
  try {
    await prisma.pageVisit.create({
      data: {
        domainId:   eventData.domainId,
        domainName: eventData.domainName,
        visitedAt:  eventData.visitedAt,
        page:       eventData.page,
        pageTitle:  eventData.pageTitle || "unknown",
        referrer:   eventData.referrer  || "unknown",
        country:    eventData.country   || "unknown",
        browser:    eventData.browser   || "unknown",
        device:     eventData.device    || "unknown",
        os:         eventData.os        || "unknown",
        timezone:   eventData.timezone  || "unknown",
        exitType:   eventData.exitType  || null,
        timeSpent:  eventData.timeSpent || 0,
        visitorId:  hashVisitorId(eventData.visitorId),
      },
    });

    console.log("✅ Event stored", {
      domainId:   eventData.domainId,
      domainName: eventData.domainName,
      visitorId:  eventData.visitorId,
    });

  } catch (err) {
    console.error("❌ Failed to store event", err);
  }
}