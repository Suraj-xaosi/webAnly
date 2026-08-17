
export function extractReferrerHostname(referrer: string | null | undefined): string {
  if (!referrer) return "direct";

  try {
    const url = new URL(referrer);
    return url.hostname || "direct";
  } catch {
    
    return "direct";
  }
}