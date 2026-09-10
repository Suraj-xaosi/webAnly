// Shared key-building logic — used by BOTH the live tracker (trackVisitor.ts)
// and the seeding logic (domainSeed.ts), so both always agree on exactly
// which Redis key a given (domain, date, dimension, value) maps to.
import { DateTime } from "luxon";

export const TRACKED_DIMENSIONS = ["page", "referrer", "browser", "os", "device", "country"] as const;
export type TrackedDimension = (typeof TRACKED_DIMENSIONS)[number];

export function getZonedNow(timezone: string): DateTime {
  const dt = DateTime.now().setZone(timezone);
  return dt.isValid ? dt : DateTime.utc(); // fallback if timezone string is bad/"Unknown"
}

export function getLocalDateString(zonedNow: DateTime): string {
  return zonedNow.toFormat("yyyy-MM-dd");
}

export function getLocalHourString(zonedNow: DateTime): string {
  return zonedNow.toFormat("HH");
}

function buildKey(domainId: string, dateStr: string, suffix: string): string {
  return `visitors:${domainId}:${dateStr}:${suffix}`;
}

export function buildHourKey(domainId: string, dateStr: string, hourStr: string): string {
  return buildKey(domainId, dateStr, `${hourStr}:domain`);
}

export function buildDayKey(domainId: string, dateStr: string): string {
  return buildKey(domainId, dateStr, "domain");
}

export function buildDimensionKey(
  domainId: string,
  dateStr: string,
  dimension: TrackedDimension,
  value: string
): string {
  return buildKey(domainId, dateStr, `${dimension}:${value}`);
}

// Not date-scoped on purpose — tracks "when did we last sync this domain's
// Redis state from the DB", independent of which local date that was.
export function buildMetaKey(domainId: string): string {
  return `visitors:${domainId}:meta:lastSynced`;
}

export function secondsUntilLocalMidnight(zonedNow: DateTime): number {
  const nextMidnight = zonedNow.plus({ days: 1 }).startOf("day");
  return Math.ceil(nextMidnight.diff(zonedNow, "seconds").seconds) + 3600; // +1h buffer, DST/clock-drift
}

export function secondsUntilNextLocalHour(zonedNow: DateTime): number {
  const nextHour = zonedNow.plus({ hours: 1 }).startOf("hour");
  return Math.ceil(nextHour.diff(zonedNow, "seconds").seconds) + 300; // +5min buffer
}

export function isTrackableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value !== "Unknown";
}