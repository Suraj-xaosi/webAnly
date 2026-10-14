import { DateTime } from "luxon";
import { prisma } from "@repo/db";
import { redis } from "@repo/redis";
import {
  TRACKED_DIMENSIONS,
  type TrackedDimension,
  buildHourKey,
  buildDayKey,
  buildDimensionKey,
  isTrackableValue,
} from "./visitorRedisKeys.js";

type Entry = {
  kind: "hour" | "day" | TrackedDimension;
  key: string;
  value?: string;
  ttl: number;
};

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

function secondsUntil(end: DateTime, visitedAt: DateTime): number {
  return Math.max(0, Math.ceil(end.diff(visitedAt, "seconds").seconds));
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
      AND "visitedAt"::timestamptz >= ${startOfDay}
      AND "visitedAt"::timestamptz < ${endOfDay}
      AND "visitedAt"::timestamptz < ${visitedAt}
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
  const eventTimezone = eventTime.zoneName ?? "UTC";
  const startOfDay = eventTime.startOf("day");
  const startOfHour = eventTime.startOf("hour");
  const dayEnd = startOfDay.plus({ days: 1 });
  let hourEnd = startOfHour.plus({ hours: 1 });
  while (hourEnd.toFormat("yyyy-MM-dd HH") === startOfHour.toFormat("yyyy-MM-dd HH")) {
    hourEnd = hourEnd.plus({ hours: 1 });
  }
  const now = DateTime.now();
  const entries: Entry[] = [
    {
      kind: "hour",
      key: buildHourKey(
        domainId,
        eventTimezone,
        startOfDay.toFormat("yyyy-MM-dd"),
        eventTime.toFormat("HH")
      ),
      ttl: secondsUntil(hourEnd, now),
    },
    {
      kind: "day",
      key: buildDayKey(domainId, eventTimezone, startOfDay.toFormat("yyyy-MM-dd")),
      ttl: secondsUntil(dayEnd, now),
    },
  ];

  for (const dimension of TRACKED_DIMENSIONS) {
    const value = dimensionValues[dimension];
    if (!isTrackableValue(value)) continue;
    entries.push({
      kind: dimension,
      key: buildDimensionKey(
        domainId,
        eventTimezone,
        startOfDay.toFormat("yyyy-MM-dd"),
        dimension,
        value
      ),
      value,
      ttl: secondsUntil(dayEnd, now),
    });
  }

  const redisSeen = new Map<string, boolean>();
  let redisAvailable = true;
  try {
    const pipeline = redis.pipeline();
    entries.forEach((entry) => {
      if (entry.ttl > 0) pipeline.sismember(entry.key, visitorId);
    });
    const results = await pipeline.exec();
    if (!results) throw new Error("Redis membership pipeline returned no results");

    let resultIndex = 0;
    for (const entry of entries) {
      if (entry.ttl <= 0) {
        redisSeen.set(entry.key, false);
        continue;
      }
      const result = results[resultIndex++];
      if (!result || result[0]) throw result?.[0] ?? new Error("Missing Redis membership result");
      redisSeen.set(entry.key, result[1] === 1);
    }
  } catch (error) {
    redisAvailable = false;
    console.error("VISITOR TRACKING: Redis lookup failed; checking the database", error);
  }

  const needsDatabase =
    !redisAvailable || entries.some((entry) => !redisSeen.get(entry.key));
  let existing: ExistingVisits | undefined;
  if (needsDatabase) {
    existing = await getExistingVisits(
      domainId,
      visitorId,
      startOfDay.toJSDate(),
      dayEnd.toJSDate(),
      eventTime.hour,
      eventTime.zoneName ?? "UTC",
      visitedAt,
      dimensionValues
    );
  }

  const hasSeen = (entry: Entry) => {
    if (redisAvailable && redisSeen.get(entry.key)) return true;
    if (!existing) return false;
    if (entry.kind === "hour" || entry.kind === "day") {
      return existing[entry.kind];
    }
    return Boolean(entry.value && existing[entry.kind]);
  };

  const isNewVisitorFor: Partial<Record<TrackedDimension, boolean>> = {};
  for (const entry of entries) {
    if (entry.kind !== "hour" && entry.kind !== "day") {
      isNewVisitorFor[entry.kind] = !hasSeen(entry);
    }
  }

  try {
    const pipeline = redis.pipeline();
    for (const entry of entries) {
      if (entry.ttl <= 0) continue;
      pipeline.sadd(entry.key, visitorId);
      pipeline.expire(entry.key, entry.ttl, "NX");
    }
    const results = await pipeline.exec();
    if (!results) throw new Error("Redis update pipeline returned no results");
    const failedResult = results.find((result) => !result || result[0]);
    if (failedResult) throw failedResult[0] ?? new Error("Missing Redis update result");
  } catch (error) {
    console.error("VISITOR TRACKING: Redis update failed; database remains authoritative", error);
  }

  return {
    isNewVisitor: !hasSeen(entries[0]!),
    isNewVisitorToday: !hasSeen(entries[1]!),
    isNewVisitorFor,
  };
}
