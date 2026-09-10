import { prisma } from "@repo/db";
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
  buildMetaKey,
  secondsUntilLocalMidnight,
  secondsUntilNextLocalHour,
  isTrackableValue,
} from "./visitorRedisKeys.js";

interface SyncMeta {
  date: string;       // local date this sync belongs to, e.g. "2026-09-10"
  syncedAtMs: number;  // epoch ms of the last successful sync
}

// Safety-net TTL on the meta key itself — belt & suspenders alongside the
// explicit grace-period cleanup in domainLifecycle.ts.
const META_TTL_SECONDS = 26 * 60 * 60;

type SeedRow = {
  visitorId: string;
  visitedAt: Date;
  page: string | null;
  referrer: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  country: string | null;
};

async function readSyncMeta(domainId: string): Promise<SyncMeta | null> {
  const raw = await redis.get(buildMetaKey(domainId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SyncMeta;
  } catch {
    return null;
  }
}

async function writeSyncMeta(domainId: string, meta: SyncMeta): Promise<void> {
  await redis.set(buildMetaKey(domainId), JSON.stringify(meta), "EX", META_TTL_SECONDS);
}

async function fetchRowsSince(domainId: string, since: Date): Promise<SeedRow[]> {
  return prisma.pageVisit.findMany({
    where: { domainId, visitedAt: { gte: since } },
    select: {
      visitorId: true,
      visitedAt: true,
      page: true,
      referrer: true,
      browser: true,
      os: true,
      device: true,
      country: true,
    },
  });
}

async function applyRowsToRedis(
  domainId: string,
  dateStr: string,
  hourStr: string,
  hourTtl: number,
  dayTtl: number,
  rows: SeedRow[],
  currentHourStartMs: number
): Promise<void> {
  if (rows.length === 0) return;

  const dayKey = buildDayKey(domainId, dateStr);
  const hourKey = buildHourKey(domainId, dateStr, hourStr);
  const touchedDimensionKeys = new Set<string>();

  const pipeline = redis.pipeline();

  for (const row of rows) {
    pipeline.sadd(dayKey, row.visitorId);

    // Only backfill the CURRENT hour's bucket — older hours are irrelevant,
    // "new this hour" only ever cares about the hour that's happening now.
    if (row.visitedAt.getTime() >= currentHourStartMs) {
      pipeline.sadd(hourKey, row.visitorId);
    }

    for (const dimension of TRACKED_DIMENSIONS) {
      const value = row[dimension as TrackedDimension];
      if (!isTrackableValue(value)) continue;
      const key = buildDimensionKey(domainId, dateStr, dimension, value);
      touchedDimensionKeys.add(key);
      pipeline.sadd(key, row.visitorId);
    }
  }

  pipeline.expire(dayKey, dayTtl, "NX");
  pipeline.expire(hourKey, hourTtl, "NX");
  for (const key of touchedDimensionKeys) pipeline.expire(key, dayTtl, "NX");

  await pipeline.exec();
}

/**
 * Single entry point for getting a domain's Redis visitor-tracking state
 * caught up to "now" — decides on its own whether that means a full
 * reseed or just filling a small gap:
 *
 *  - No previous sync meta, OR meta belongs to a different local date
 *    (day rolled over while disconnected) → FULL reseed: pull the whole
 *    of today from the DB.
 *  - Meta exists and belongs to today → GAP-FILL: pull only rows since
 *    the last sync, cheap query, cheap pipeline.
 *
 * Either way, external behavior (what checkVisitorNewness reports to the
 * frontend afterwards) ends up identical to "as if tracking never
 * stopped".
 */
export async function seedDomain(domainId: string, timezone: string): Promise<void> {
  const zonedNow = getZonedNow(timezone);
  const dateStr = getLocalDateString(zonedNow);
  const hourStr = getLocalHourString(zonedNow);
  const dayTtl = secondsUntilLocalMidnight(zonedNow);
  const hourTtl = secondsUntilNextLocalHour(zonedNow);
  const currentHourStartMs = zonedNow.startOf("hour").toMillis();

  const existingMeta = await readSyncMeta(domainId);
  const isSameLocalDay = existingMeta?.date === dateStr;

  const since = isSameLocalDay
    ? new Date(existingMeta!.syncedAtMs)
    : zonedNow.startOf("day").toJSDate();

  const rows = await fetchRowsSince(domainId, since);
  await applyRowsToRedis(domainId, dateStr, hourStr, hourTtl, dayTtl, rows, currentHourStartMs);
  await writeSyncMeta(domainId, { date: dateStr, syncedAtMs: Date.now() });
}

/**
 * Explicit cleanup after the grace period expires with no reconnect —
 * this is what actually saves memory for domains nobody watches again
 * today. TTL on individual keys is still there as a backup safety net
 * (e.g. if the process restarts mid-grace-period and this never fires).
 */
export async function clearDomainRedisData(domainId: string): Promise<void> {
  const pattern = `visitors:${domainId}:*`;
  let cursor = "0";
  do {
    const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 200);
    cursor = nextCursor;
    if (keys.length > 0) await redis.del(...keys);
  } while (cursor !== "0");
}