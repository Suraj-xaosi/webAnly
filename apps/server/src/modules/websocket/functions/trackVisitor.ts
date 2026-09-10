import { redis } from "@repo/redis";
import {
  TRACKED_DIMENSIONS,
  TrackedDimension,
  getZonedNow,
  getLocalDateString,
  getLocalHourString,
  buildHourKey,
  buildDayKey,
  buildDimensionKey,
  secondsUntilLocalMidnight,
  secondsUntilNextLocalHour,
  isTrackableValue,
} from "./visitorRedisKeys.js";

const DOMAIN_WIDE_HOUR = "domain-hour";
const DOMAIN_WIDE_DAY = "domain-day";
type EntryKind = typeof DOMAIN_WIDE_HOUR | typeof DOMAIN_WIDE_DAY | TrackedDimension;

export interface VisitorNewnessResult {
  isNewVisitor: boolean;
  isNewVisitorToday: boolean;
  isNewVisitorFor: Partial<Record<TrackedDimension, boolean>>;
}

/**
 * OPTIMIZED vs the original one-pipeline version.
 *
 * Old: every event → 1 pipeline → up to 16 commands (8x SADD + 8x EXPIRE
 * NX), no matter what. EXPIRE ran even on repeat visits where the key
 * already existed (NX made it a safe no-op, but Redis still had to
 * process the command).
 *
 * New: 2 phases.
 *   Phase 1 — SADD only, single round trip (up to 8 commands).
 *   Phase 2 — EXPIRE, ONLY for the specific keys where SADD actually
 *   added a new member this call, AND only if at least one such key
 *   exists (otherwise phase 2 is skipped entirely — zero extra commands,
 *   zero extra round trip).
 *
 * Repeat pageviews / same-session events (the majority of traffic) never
 * touch phase 2 at all. Net effect: roughly half the Redis commands in
 * steady state, same external behavior, same TTL correctness (NX still
 * guards against clobbering an existing TTL).
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
  const dayTtl = secondsUntilLocalMidnight(zonedNow);
  const hourTtl = secondsUntilNextLocalHour(zonedNow);

  const entries: { kind: EntryKind; key: string; ttl: number }[] = [
    { kind: DOMAIN_WIDE_HOUR, key: buildHourKey(domainId, dateStr, hourStr), ttl: hourTtl },
    { kind: DOMAIN_WIDE_DAY, key: buildDayKey(domainId, dateStr), ttl: dayTtl },
  ];

  for (const dimension of TRACKED_DIMENSIONS) {
    const value = dimensionValues[dimension];
    if (!isTrackableValue(value)) continue; // skip null/"Unknown" — no point tracking noise
    entries.push({ kind: dimension, key: buildDimensionKey(domainId, dateStr, dimension, value), ttl: dayTtl });
  }

  // ── Phase 1: SADD only ──────────────────────────────────────────────
  const saddPipeline = redis.pipeline();
  for (const entry of entries) saddPipeline.sadd(entry.key, visitorId);
  const saddResults = await saddPipeline.exec();

  if (!saddResults) {
    // Pipeline failed entirely (e.g. Redis connection drop) — fail safe as
    // "not new" rather than crash the consumer or block message delivery.
    return { isNewVisitor: false, isNewVisitorToday: false, isNewVisitorFor: {} };
  }

  const isNewVisitorFor: Partial<Record<TrackedDimension, boolean>> = {};
  let isNewVisitor = false;
  let isNewVisitorToday = false;
  const newlyAdded: typeof entries = [];

  entries.forEach((entry, i) => {
    const result = saddResults[i]; // ioredis: [error, value]
    const added = result && !result[0] ? result[1] === 1 : false;

    if (added) newlyAdded.push(entry);

    if (entry.kind === DOMAIN_WIDE_HOUR) isNewVisitor = added;
    else if (entry.kind === DOMAIN_WIDE_DAY) isNewVisitorToday = added;
    else isNewVisitorFor[entry.kind] = added;
  });

  // ── Phase 2: EXPIRE, only for keys that got a new member, only if any exist ──
  if (newlyAdded.length > 0) {
    const expirePipeline = redis.pipeline();
    for (const entry of newlyAdded) expirePipeline.expire(entry.key, entry.ttl, "NX");
    await expirePipeline.exec();
  }

  return { isNewVisitor, isNewVisitorToday, isNewVisitorFor };
}