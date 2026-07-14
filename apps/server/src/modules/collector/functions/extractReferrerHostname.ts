//apps/server/src/modules/collector/functions/extractReferrerHostname.ts
export function extractReferrerHostname(referrer: string | null | undefined): string {
  if (!referrer) return "direct";

  try {
    const url = new URL(referrer);
    // Same-site referrer (e.g. internal reload, or SPA-adjacent full navigation)
    // isn't a real external traffic source — treat as direct.
    return url.hostname || "direct";
  } catch {
    // referrer wasn't a valid absolute URL (e.g. already just a path) — treat as direct
    return "direct";
  }
}