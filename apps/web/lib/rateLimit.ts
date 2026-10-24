import { createHash } from "node:crypto"

const RATE_LIMIT_BY_SCOPE = {
  user: 10,
  ip: 40,
} as const
const RATE_WINDOW_MS = 60_000

const MAX_BUCKETS = 20_000
const buckets = new Map<string, { count: number; resetAt: number }>()
export interface RateLimitResult {
  limited: boolean
  retryAfterSeconds: number
}

function normalizeIdentity(value: string): string {
  return value.trim()
}

export function checkWebRateLimit(
  scope: "user" | "ip",
  identity: string,
  resource: string
): RateLimitResult {
  const safeScope = scope === "user" ? "user" : "ip"
  const safeIdentity = normalizeIdentity(identity)
  const safeResource = resource.trim()

  if (!safeIdentity || !safeResource) {
    return { limited: false, retryAfterSeconds: 0 }
  }

  const identityHash = createHash("sha256")
    .update(`${safeScope}:${safeIdentity}:${safeResource}`)
    .digest("hex")

  const limit = RATE_LIMIT_BY_SCOPE[safeScope]

  const key = `web:rate:v1:${identityHash}`
  const now = Date.now()
  let bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      const oldestKey = buckets.keys().next().value
      if (oldestKey) buckets.delete(oldestKey)
    }
    bucket = { count: 0, resetAt: now + RATE_WINDOW_MS }
    buckets.set(key, bucket)
  }
  bucket.count += 1
  buckets.delete(key)
  buckets.set(key, bucket)
  const ttlMs = bucket.resetAt - now

  return {
    limited: bucket.count > limit,
    retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)),
  }
}
