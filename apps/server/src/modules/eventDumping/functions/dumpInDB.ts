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
  try {
    if (eventData.exitType === "hidden") {
      // "hidden" is not a real event, just a signal that the tab was hidden. Do not store it.
      return;
    }
    await prisma.pageVisit.create({
      data: {
        domainId:     eventData.domainId,
        domainName:   eventData.domainName,
        visitedAt:    eventData.visitedAt,
        page:         eventData.page,
        pageTitle:    eventData.pageTitle || "unknown",
        // null is meaningful here: it means "not an external arrival", so the
        // referrer dimension (IS NOT NULL) skips these rows. Do not default to "unknown".
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

    console.log("✅ EVENT DUMPING: Event stored", {
      domainId:   eventData.domainId,
      domainName: eventData.domainName,
      visitorId:  eventData.visitorId,
    });
  } catch (err) {
    console.error(" EVENT DUMPING WORKER : Failed to store event", err);
  }
}