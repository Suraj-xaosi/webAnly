// src/modules/websocket/functions/trackVisitor.ts
import { redis } from "@repo/redis";
import { DateTime } from "luxon";

const DOMAIN_WIDE = "domain";
const TRACKED_DIMENSIONS = ["page", "referrer", "browser", "os", "device", "country"] as const;
type TrackedDimension = (typeof TRACKED_DIMENSIONS)[number];

function getZonedNow(timezone: string): DateTime {
  const dt = DateTime.now().setZone(timezone);
  return dt.isValid ? dt : DateTime.utc(); // fallback if timezone string is bad/"Unknown"
}

function getLocalDateString(zonedNow: DateTime): string {
  return zonedNow.toFormat("yyyy-MM-dd");
}

function secondsUntilLocalMidnight(zonedNow: DateTime): number {
  const nextMidnight = zonedNow.plus({ days: 1 }).startOf("day");
  const diff = nextMidnight.diff(zonedNow, "seconds").seconds;
  return Math.ceil(diff) + 3600; // +1h buffer for DST/clock-drift edge cases
}

function isTrackableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value !== "Unknown";
}

export interface VisitorNewnessResult {
  isNewVisitor: boolean; // domain-wide, once per day (unchanged meaning)
  isNewVisitorFor: Partial<Record<TrackedDimension, boolean>>;
}

/**
 * Single Redis pipeline round-trip that computes:
 *  - whether this visitor is new to the domain today
 *  - whether this visitor is new to EACH individual dimension value today
 *    (page, referrer, browser, os, device, country)
 *
 * Backed by Redis Sets (SADD returns 1 = new, 0 = already present) with a TTL
 * that expires at the domain's local midnight — applied only if not already set (NX),
 * so we're not resetting the clock on every event.
 */
export async function checkVisitorNewness(
  domainId: string,
  visitorId: string,
  timezone: string,
  dimensionValues: Partial<Record<TrackedDimension, unknown>>
): Promise<VisitorNewnessResult> {
  if (!visitorId) {
    return { isNewVisitor: false, isNewVisitorFor: {} };
  }

  const zonedNow = getZonedNow(timezone);
  const dateStr = getLocalDateString(zonedNow);
  const ttl = secondsUntilLocalMidnight(zonedNow);

  const buildKey = (suffix: string) => `visitors:${domainId}:${dateStr}:${suffix}`;

  // Pipeline results come back as a flat array in command order, so we track
  // which slot corresponds to which dimension as we build it.
  const entries: { dimension: TrackedDimension | typeof DOMAIN_WIDE }[] = [];
  const pipeline = redis.pipeline();

  const domainKey = buildKey(DOMAIN_WIDE);
  entries.push({ dimension: DOMAIN_WIDE });
  pipeline.sadd(domainKey, visitorId);
  pipeline.expire(domainKey, ttl, "NX");

  for (const dimension of TRACKED_DIMENSIONS) {
    const value = dimensionValues[dimension];
    if (!isTrackableValue(value)) continue; // skip null/"Unknown" — no point tracking noise

    const key = buildKey(`${dimension}:${value}`);
    entries.push({ dimension });
    pipeline.sadd(key, visitorId);
    pipeline.expire(key, ttl, "NX");
  }

  const results = await pipeline.exec();

  if (!results) {
    // Pipeline failed entirely (e.g. Redis connection drop) — fail safe as
    // "not new" rather than crash the consumer or block message delivery.
    return { isNewVisitor: false, isNewVisitorFor: {} };
  }

  const isNewVisitorFor: Partial<Record<TrackedDimension, boolean>> = {};
  let isNewVisitor = false;

  // Each entry consumed exactly 2 pipeline commands (SADD then EXPIRE), in order.
  entries.forEach((entry, i) => {
    const saddResult = results[i * 2]; // ioredis pipeline result: [error, value]
    const added = saddResult && !saddResult[0] ? saddResult[1] === 1 : false;

    if (entry.dimension === DOMAIN_WIDE) {
      isNewVisitor = added;
    } else {
      isNewVisitorFor[entry.dimension] = added;
    }
  });

  return { isNewVisitor, isNewVisitorFor };
}