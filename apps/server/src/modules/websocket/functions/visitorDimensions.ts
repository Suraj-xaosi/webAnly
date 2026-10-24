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

export function isTrackableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value !== "Unknown";
}