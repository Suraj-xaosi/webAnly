import { prisma } from "@repo/db";

type EventData = {
  domainId:      string;
  domainName:    string;
  visitorId:     string;
  page:          string;
  visitedAt:     Date;
  pageTitle?:    string | null;
  referrer?:     string | null;   // external source only; null for internal navigation
  previousPage?: string | null;   // page on the same site they came from; null for external/direct arrivals
  country?:      string;
  city?:         string;
  browser?:      string;
  device?:       string;
  os?:           string;
  timezone?:     string;
  exitType?:     string | null;
  timeSpent?:    number;
};

export default async function dumpInDB(eventData: EventData) {
  if (eventData.exitType === "hidden") {
    return;
  }
  await prisma.pageVisit.create({
    data: {
      domainId:     eventData.domainId,
      domainName:   eventData.domainName,
      visitedAt:    eventData.visitedAt,
      page:         eventData.page,
      pageTitle:    eventData.pageTitle || "unknown",
      referrer:     eventData.referrer ?? null,
      previousPage: eventData.previousPage ?? null,
      country:      eventData.country   || "unknown",
      city:         eventData.city      || "unknown",
      browser:      eventData.browser   || "unknown",
      device:       eventData.device    || "unknown",
      os:           eventData.os        || "unknown",
      timezone:     eventData.timezone  || "unknown",
      exitType:     eventData.exitType  || null,
      timeSpent:    eventData.timeSpent || 0,
      visitorId:    eventData.visitorId,
    },
  });

  console.log("EVENT DUMPING: Event stored", {
    domainId: eventData.domainId,
    domainName: eventData.domainName,
    visitorId: eventData.visitorId,
  });
}