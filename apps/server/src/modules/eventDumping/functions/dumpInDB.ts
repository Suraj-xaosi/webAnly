
import { prisma }      from "@repo/db";



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
    if (eventData.exitType === "hidden") {
      // If the exitType is "hidden", we do not want to store this event in the database because it is not a real event. It is just a signal that the user has left the page. So we will just return from this function and not store this event in the database.
      return;
    }
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
        visitorId:  eventData.visitorId,
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

