import { createHash } from "crypto";

const API_KEY_REQUEST_LIMIT = 50;
const IP_REQUEST_LIMIT = 300;
const REQUEST_WINDOW_MS = 60_000;
const MAX_IDENTITIES = 20_000;

type RateLimitEntry = {
  requests: number[];
};

const requestsByIdentity = new Map<string, RateLimitEntry>();

export type CollectorRateLimitScope = "api-key" | "ip";

export interface CollectorRateLimitResult {
  scope: CollectorRateLimitScope;
  retryAfterSeconds: number;
}

function checkRateLimit(
  identity: string,
  scope: CollectorRateLimitScope,
  requestLimit: number
): CollectorRateLimitResult | null {
  const normalizedIdentity = identity.trim();
  if (!normalizedIdentity) return null;

  const identityHash = createHash("sha256").update(normalizedIdentity).digest("hex");
  const key = `${scope}:${identityHash}`;
  const now = Date.now();
  const cutoff = now - REQUEST_WINDOW_MS;
  let entry = requestsByIdentity.get(key);

  if (!entry) {
    if (requestsByIdentity.size >= MAX_IDENTITIES) {
      const oldestKey = requestsByIdentity.keys().next().value;
      if (oldestKey) requestsByIdentity.delete(oldestKey);
    }
    entry = { requests: [] };
    requestsByIdentity.set(key, entry);
  } else {
    while (entry.requests[0] !== undefined && entry.requests[0] <= cutoff) {
      entry.requests.shift();
    }
    requestsByIdentity.delete(key);
    requestsByIdentity.set(key, entry);
  }

  entry.requests.push(now);
  if (entry.requests.length <= requestLimit) return null;

  return {
    scope,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((entry.requests[0]! + REQUEST_WINDOW_MS - now) / 1000)
    ),
  };
}

export function checkCollectorIpRateLimit(
  ipAddress: string
): CollectorRateLimitResult | null {
  return checkRateLimit(ipAddress, "ip", IP_REQUEST_LIMIT);
}

export function checkCollectorRateLimit(
  apiKey: string
): CollectorRateLimitResult | null {
  return checkRateLimit(apiKey, "api-key", API_KEY_REQUEST_LIMIT);
}
