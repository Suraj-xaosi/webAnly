import { DateTime } from "luxon";
import { prisma } from "@repo/db";
import {
  TRACKED_DIMENSIONS,
  type TrackedDimension,
  isTrackableValue,
} from "./visitorDimensions.js";

type ExistingVisits = Record<TrackedDimension, boolean> & {
  hour: boolean;
  day: boolean;
};

export interface VisitorNewnessResult {
  isNewVisitor: boolean;
  isNewVisitorToday: boolean;
  isNewVisitorFor: Partial<Record<TrackedDimension, boolean>>;
}

function getZonedVisitTime(visitedAt: Date, timezone: string): DateTime {
  const eventTime = DateTime.fromJSDate(visitedAt, { zone: "utc" }).setZone(timezone);
  return eventTime.isValid ? eventTime : DateTime.fromJSDate(visitedAt, { zone: "utc" });
}

async function getExistingVisits(
  domainId: string,
  visitorId: string,
  startOfDay: Date,
  endOfDay: Date,
  localHour: number,
  timezone: string,
  visitedAt: Date,
  dimensionValues: Partial<Record<TrackedDimension, unknown>>
): Promise<ExistingVisits> {
  const [existing] = await prisma.$queryRaw<ExistingVisits[]>`
    SELECT
      COALESCE(BOOL_OR(
        EXTRACT(HOUR FROM ("visitedAt"::timestamptz AT TIME ZONE ${timezone}))::int = ${localHour}
      ), FALSE) AS hour,
      COUNT(*) > 0 AS day,
      COALESCE(BOOL_OR("page" = ${dimensionValues.page}), FALSE) AS page,
      COALESCE(BOOL_OR("referrer" = ${dimensionValues.referrer}), FALSE) AS referrer,
      COALESCE(BOOL_OR("browser" = ${dimensionValues.browser}), FALSE) AS browser,
      COALESCE(BOOL_OR("os" = ${dimensionValues.os}), FALSE) AS os,
      COALESCE(BOOL_OR("device" = ${dimensionValues.device}), FALSE) AS device,
      COALESCE(BOOL_OR("country" = ${dimensionValues.country}), FALSE) AS country,
      COALESCE(BOOL_OR("city" = ${dimensionValues.city}), FALSE) AS city
    FROM "page_visit"
    WHERE "domainId" = ${domainId}
      AND "visitorId" = ${visitorId}
      AND "visitedAt" >= ${startOfDay}
      AND "visitedAt" < ${endOfDay}
      AND "visitedAt" <= ${visitedAt}
  `;

  return existing ?? {
    hour: false,
    day: false,
    page: false,
    referrer: false,
    browser: false,
    os: false,
    device: false,
    country: false,
    city: false,
  };
}

export async function checkVisitorNewness(
  domainId: string,
  visitorId: string,
  timezone: string,
  visitedAt: Date,
  dimensionValues: Partial<Record<TrackedDimension, unknown>>
): Promise<VisitorNewnessResult> {
  if (!visitorId) {
    return {
      isNewVisitor: false,
      isNewVisitorToday: false,
      isNewVisitorFor: {},
    };
  }

  const eventTime = getZonedVisitTime(visitedAt, timezone);
  const startOfDay = eventTime.startOf("day");
  const existing = await getExistingVisits(
    domainId,
    visitorId,
    startOfDay.toJSDate(),
    startOfDay.plus({ days: 1 }).toJSDate(),
    eventTime.hour,
    eventTime.zoneName ?? "UTC",
    visitedAt,
    dimensionValues
  );

  const isNewVisitorFor: Partial<Record<TrackedDimension, boolean>> = {};
  for (const dimension of TRACKED_DIMENSIONS) {
    if (isTrackableValue(dimensionValues[dimension])) {
      isNewVisitorFor[dimension] = !existing[dimension];
    }
  }

  return {
    isNewVisitor: !existing.hour,
    isNewVisitorToday: !existing.day,
    isNewVisitorFor,
  };
}
