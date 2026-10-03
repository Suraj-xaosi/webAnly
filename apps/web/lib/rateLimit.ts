import { createHash } from "node:crypto"
import { redis } from "@repo/redis"

const RATE_LIMIT = 20
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

export async function checkWebRateLimit(
  scope: "user" | "ip",
  identity: string
): Promise<RateLimitResult> {
  const identityHash = createHash("sha256")
    .update(`${scope}:${identity}`)
    .digest("hex")

  const [limited, ttlMs] = (await redis.eval(
    RATE_LIMIT_SCRIPT,
    1,
    `web:rate:v1:${identityHash}`,
    String(RATE_WINDOW_MS),
    String(RATE_LIMIT)
  )) as [number, number]

  return {
    limited: limited === 1,
    retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)),
  }
}
