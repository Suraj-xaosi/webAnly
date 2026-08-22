import { redis } from "@repo/redis";
import { DateTime } from "luxon";

const DOMAIN_WIDE_HOUR = "domain-hour";
const DOMAIN_WIDE_DAY = "domain-day";
const TRACKED_DIMENSIONS = ["page", "referrer", "browser", "os", "device", "country"] as const;
type TrackedDimension = (typeof TRACKED_DIMENSIONS)[number];

// Entry "kind" tags — lets the result-parsing loop tell the two domain-wide
// entries apart (hour vs day) in addition to the per-dimension ones.
type EntryKind = typeof DOMAIN_WIDE_HOUR | typeof DOMAIN_WIDE_DAY | TrackedDimension;

function getZonedNow(timezone: string): DateTime {
  const dt = DateTime.now().setZone(timezone);
  return dt.isValid ? dt : DateTime.utc(); // fallback if timezone string is bad/"Unknown"
}

function getLocalDateString(zonedNow: DateTime): string {
  return zonedNow.toFormat("yyyy-MM-dd");
}

// Zero-padded local hour, e.g. "08", "09", "23" — used only for the
// hour-bucketed domain-wide isNewVisitor.
function getLocalHourString(zonedNow: DateTime): string {
  return zonedNow.toFormat("HH");
}

function secondsUntilLocalMidnight(zonedNow: DateTime): number {
  const nextMidnight = zonedNow.plus({ days: 1 }).startOf("day");
  const diff = nextMidnight.diff(zonedNow, "seconds").seconds;
  return Math.ceil(diff) + 3600; // +1h buffer for DST/clock-drift edge cases
}

// Seconds until the next local hour boundary — used only for the
// hour-bucketed domain-wide isNewVisitor's TTL. Buffer is intentionally
// small (a few minutes, not an hour) since a full-hour buffer would delay
// the bucket's expiry into the next hour and blunt the hourly granularity.
function secondsUntilNextLocalHour(zonedNow: DateTime): number {
  const nextHour = zonedNow.plus({ hours: 1 }).startOf("hour");
  const diff = nextHour.diff(zonedNow, "seconds").seconds;
  return Math.ceil(diff) + 300; // +5min buffer for clock-drift edge cases
}

function isTrackableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value !== "Unknown";
}

export interface VisitorNewnessResult {
  isNewVisitor: boolean; // domain-wide, once per LOCAL HOUR
  isNewVisitorToday: boolean; // domain-wide, once per LOCAL DAY (the original isNewVisitor behavior)
  isNewVisitorFor: Partial<Record<TrackedDimension, boolean>>;
}

/**
 * Single Redis pipeline round-trip that computes:
 *  - whether this visitor is new to the domain THIS HOUR (local time)
 *  - whether this visitor is new to the domain TODAY (local time)
 *  - whether this visitor is new to EACH individual dimension value today
 *    (page, referrer, browser, os, device, country)
 *
 * Backed by Redis Sets (SADD returns 1 = new, 0 = already present) with a TTL
 * that expires at the relevant local boundary — applied only if not already
 * set (NX), so no resetting the clock on every event.
 *
 *  - isNewVisitor key is bucketed by LOCAL DATE + LOCAL HOUR, TTL expires at
 *    the next local hour boundary. New once per local hour.
 *  - isNewVisitorToday key is bucketed by LOCAL DATE only, TTL expires at
 *    local midnight. New once per local day — this is the original
 *    isNewVisitor behavior, unchanged, just under a new name.
 *  - Per-dimension keys are UNCHANGED: bucketed by local date only, TTL
 *    expires at local midnight, exactly as before.
 */
export async function checkVisitorNewness(
  domainId: string,
  visitorId: string,
  timezone: string,
  dimensionValues: Partial<Record<TrackedDimension, unknown>>
): Promise<VisitorNewnessResult> {
  if (!visitorId) {
    return { isNewVisitor: false, isNewVisitorToday: false, isNewVisitorFor: {} };
  }

  const zonedNow = getZonedNow(timezone);
  const dateStr = getLocalDateString(zonedNow);
  const hourStr = getLocalHourString(zonedNow);
  const ttl = secondsUntilLocalMidnight(zonedNow); // used by day-level keys (today + per-dimension)
  const hourTtl = secondsUntilNextLocalHour(zonedNow); // used by the hour-level key only

  const buildKey = (suffix: string) => `visitors:${domainId}:${dateStr}:${suffix}`;

  // Pipeline results come back as a flat array in command order, so we track
  // which slot corresponds to which entry as we build it.
  const entries: { kind: EntryKind }[] = [];
  const pipeline = redis.pipeline();

  // 1. Hour-bucketed domain-wide key (isNewVisitor).
  const hourKey = buildKey(`${hourStr}:domain`);
  entries.push({ kind: DOMAIN_WIDE_HOUR });
  pipeline.sadd(hourKey, visitorId);
  pipeline.expire(hourKey, hourTtl, "NX");

  // 2. Day-bucketed domain-wide key (isNewVisitorToday) — this is exactly
  //    the original domain-wide key/logic, just tracked as its own entry now.
  const dayKey = buildKey("domain");
  entries.push({ kind: DOMAIN_WIDE_DAY });
  pipeline.sadd(dayKey, visitorId);
  pipeline.expire(dayKey, ttl, "NX");

  // 3. Per-dimension keys — unchanged.
  for (const dimension of TRACKED_DIMENSIONS) {
    const value = dimensionValues[dimension];
    if (!isTrackableValue(value)) continue; // skip null/"Unknown" — no point tracking noise

    const key = buildKey(`${dimension}:${value}`);
    entries.push({ kind: dimension });
    pipeline.sadd(key, visitorId);
    pipeline.expire(key, ttl, "NX");
  }

  const results = await pipeline.exec();

  if (!results) {
    // Pipeline failed entirely (e.g. Redis connection drop) — fail safe as
    // "not new" rather than crash the consumer or block message delivery.
    return { isNewVisitor: false, isNewVisitorToday: false, isNewVisitorFor: {} };
  }

  const isNewVisitorFor: Partial<Record<TrackedDimension, boolean>> = {};
  let isNewVisitor = false;
  let isNewVisitorToday = false;

  // Each entry consumed exactly 2 pipeline commands (SADD then EXPIRE), in order.
  entries.forEach((entry, i) => {
    const saddResult = results[i * 2]; // ioredis pipeline result: [error, value]
    const added = saddResult && !saddResult[0] ? saddResult[1] === 1 : false;

    if (entry.kind === DOMAIN_WIDE_HOUR) {
      isNewVisitor = added;
    } else if (entry.kind === DOMAIN_WIDE_DAY) {
      isNewVisitorToday = added;
    } else {
      isNewVisitorFor[entry.kind] = added;
    }
  });

  return { isNewVisitor, isNewVisitorToday, isNewVisitorFor };
}