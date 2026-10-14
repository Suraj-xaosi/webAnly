export const TRACKED_DIMENSIONS = [
  "page",
  "referrer",
  "browser",
  "os",
  "device",
  "country",
  "city",
] as const;
export type TrackedDimension = (typeof TRACKED_DIMENSIONS)[number];

function buildKey(domainId: string, timezone: string, dateStr: string, suffix: string): string {
  return `visitors:v2:${domainId}:${encodeURIComponent(timezone)}:${dateStr}:${suffix}`;
}

export function buildHourKey(
  domainId: string,
  timezone: string,
  dateStr: string,
  hourStr: string
): string {
  return buildKey(domainId, timezone, dateStr, `${hourStr}:domain`);
}

export function buildDayKey(domainId: string, timezone: string, dateStr: string): string {
  return buildKey(domainId, timezone, dateStr, "domain");
}

export function buildDimensionKey(
  domainId: string,
  timezone: string,
  dateStr: string,
  dimension: TrackedDimension,
  value: string
): string {
  return buildKey(domainId, timezone, dateStr, `${dimension}:${value}`);
}

export function isTrackableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value !== "Unknown";
}