import { createHash } from "node:crypto"
import { redis } from "@repo/redis"

const RATE_LIMIT_BY_SCOPE = {
  user: 10,
  ip: 40,
} as const
const RATE_WINDOW_MS = 60_000

const RATE_LIMIT_SCRIPT = `
local requestCount = redis.call("INCR", KEYS[1])
if requestCount == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end

local ttl = redis.call("PTTL", KEYS[1])
if requestCount > tonumber(ARGV[2]) then
  return { 1, ttl }
end

return { 0, ttl }
`
export interface RateLimitResult {
  limited: boolean
  retryAfterSeconds: number
}

function normalizeIdentity(value: string): string {
  return value.trim()
}

export async function checkWebRateLimit(
  scope: "user" | "ip",
  identity: string,
  resource: string
): Promise<RateLimitResult> {
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

  const [limited, ttlMs] = (await redis.eval(
    RATE_LIMIT_SCRIPT,
    1,
    `web:rate:v1:${identityHash}`,
    String(RATE_WINDOW_MS),
    String(limit)
  )) as [number, number]

  return {
    limited: limited === 1,
    retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)),
  }
}
