import { createHash, randomUUID } from "crypto"
import { redis } from "@repo/redis"
import { createHttpError } from "../../../shared/errors.js"

const API_KEY_REQUEST_LIMIT = 50
const IP_REQUEST_LIMIT = 300
const REQUEST_WINDOW_MS = 60_000

const RATE_LIMIT_SCRIPT = `
local redisTime = redis.call("TIME")
local now = tonumber(redisTime[1]) * 1000 + math.floor(tonumber(redisTime[2]) / 1000)
local requestWindowMs = tonumber(ARGV[2])

redis.call("ZREMRANGEBYSCORE", KEYS[1], "-inf", now - requestWindowMs)
redis.call("ZADD", KEYS[1], now, ARGV[1])
redis.call("PEXPIRE", KEYS[1], requestWindowMs + 1000)

local requestCount = redis.call("ZCARD", KEYS[1])
if requestCount <= tonumber(ARGV[3]) then
  return { 0, 0 }
end

local ttl = redis.call("PTTL", KEYS[1])
if ttl <= 0 then
  ttl = requestWindowMs
end

return { 1, ttl }
`
export type CollectorRateLimitScope = "api-key" | "ip"

export interface CollectorRateLimitResult {
  scope: CollectorRateLimitScope
  retryAfterSeconds: number
}

function hashIdentity(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

async function checkRateLimit(
  identity: string,
  scope: CollectorRateLimitScope,
  requestLimit: number
): Promise<CollectorRateLimitResult | null> {
  const normalizedIdentity = identity.trim()
  if (!normalizedIdentity) return null

  const identityHash = hashIdentity(normalizedIdentity)
  const redisKey = scope === "api-key"
    ? `collector:rate:v1:requests:${identityHash}`
    : `collector:rate:v1:requests:ip:${identityHash}`

  try {
    const result = (await redis.eval(
      RATE_LIMIT_SCRIPT,
      1,
      redisKey,
      randomUUID(),
      String(REQUEST_WINDOW_MS),
      String(requestLimit)
    )) as [number, number]

    const [resultCode, ttlMs] = result
    if (resultCode === 0) return null

    return {
      scope,
      retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)),
    }
  } catch (error) {
    console.error(`Collector ${scope} rate limiter Redis check failed.`, error)
    throw createHttpError(
      503,
      "Collector rate limiter is temporarily unavailable. Retry shortly.",
      "RATE_LIMITER_UNAVAILABLE",
      5
    )
  }
}

export function checkCollectorIpRateLimit(
  ipAddress: string
): Promise<CollectorRateLimitResult | null> {
  return checkRateLimit(ipAddress, "ip", IP_REQUEST_LIMIT)
}

export function checkCollectorRateLimit(
  apiKey: string
): Promise<CollectorRateLimitResult | null> {
  return checkRateLimit(apiKey, "api-key", API_KEY_REQUEST_LIMIT)
}
