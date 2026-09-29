import { createHash, randomUUID } from "crypto"
import { LRUCache } from "lru-cache"
import { redis } from "@repo/redis"

const REQUEST_LIMIT = 300
const REQUEST_WINDOW_MS = 60_000
const API_KEY_BAN_MS = 2 * 60_000
const BAN_HISTORY_WINDOW_MS = 10 * 60_000
const MAX_BAN_EVENTS = 5
const IP_BAN_MS = 60 * 60_000

const ACTIVE_BAN_CACHE_MAX = 20_000

interface LocalBanCacheEntry {
  scope: CollectorRateLimitScope
  expiresAt: number
}

const activeBanCache = new LRUCache<string, LocalBanCacheEntry>({
  max: ACTIVE_BAN_CACHE_MAX,
})

const RATE_LIMIT_SCRIPT = `
local hasClientIp = ARGV[9] == "1"

if hasClientIp then
  local ipBanTtl = redis.call("PTTL", KEYS[4])
  if ipBanTtl > 0 then
    return { 2, ipBanTtl }
  end
end

local apiKeyBanTtl = redis.call("PTTL", KEYS[2])
if apiKeyBanTtl > 0 then
  return { 1, apiKeyBanTtl }
end

local redisTime = redis.call("TIME")
local now = tonumber(redisTime[1]) * 1000 + math.floor(tonumber(redisTime[2]) / 1000)
local requestWindowMs = tonumber(ARGV[3])

redis.call("ZREMRANGEBYSCORE", KEYS[1], "-inf", now - requestWindowMs)
redis.call("ZADD", KEYS[1], now, ARGV[1])
redis.call("PEXPIRE", KEYS[1], requestWindowMs + 1000)

local requestCount = redis.call("ZCARD", KEYS[1])
if requestCount <= tonumber(ARGV[4]) then
  return { 0, 0 }
end

local newBan = redis.call("SET", KEYS[2], "1", "PX", ARGV[5], "NX")
if not newBan then
  return { 1, redis.call("PTTL", KEYS[2]) }
end

local banHistoryWindowMs = tonumber(ARGV[6])
redis.call("ZREMRANGEBYSCORE", KEYS[3], "-inf", now - banHistoryWindowMs)
redis.call("ZADD", KEYS[3], now, ARGV[2])
redis.call("PEXPIRE", KEYS[3], banHistoryWindowMs)

local banCount = redis.call("ZCARD", KEYS[3])
if hasClientIp and banCount > tonumber(ARGV[7]) then
  redis.call("SET", KEYS[4], "1", "PX", ARGV[8])
  return { 2, tonumber(ARGV[8]) }
end

return { 1, tonumber(ARGV[5]) }
`

export type CollectorRateLimitScope = "api-key" | "ip"

export interface CollectorRateLimitResult {
  scope: CollectorRateLimitScope
  retryAfterSeconds: number
}

export class CollectorRateLimiterUnavailableError extends Error {
  constructor() {
    super("Collector rate limiter is unavailable.")
    this.name = "CollectorRateLimiterUnavailableError"
  }
}

function hashIdentity(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

function getCachedBan(key: string): CollectorRateLimitResult | null {
  const entry = activeBanCache.get(key)
  if (!entry) return null

  return {
    scope: entry.scope,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((entry.expiresAt - Date.now()) / 1000)
    ),
  }
}

function cacheBan(key: string, scope: CollectorRateLimitScope, ttlMs: number) {
  const safeTtl = Math.max(ttlMs, 1)
  activeBanCache.set(
    key,
    { scope, expiresAt: Date.now() + safeTtl },
    { ttl: safeTtl }
  )
}

export async function checkCollectorIpBan(
  clientIp: string
): Promise<CollectorRateLimitResult | null> {
  if (!clientIp) return null

  const ipHash = hashIdentity(clientIp)
  const cacheKey = `ip:${ipHash}`
  const cachedBan = getCachedBan(cacheKey)
  if (cachedBan) return cachedBan

  try {
    const ttlMs = await redis.pttl(`collector:rate:v1:ip-ban:${ipHash}`)
    if (ttlMs <= 0) return null

    cacheBan(cacheKey, "ip", ttlMs)
    return {
      scope: "ip",
      retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)),
    }
  } catch (error) {
    console.error("Collector IP-ban check failed.", error)
    throw new CollectorRateLimiterUnavailableError()
  }
}

export async function checkCollectorRateLimit(
  apiKey: string,
  clientIp: string
): Promise<CollectorRateLimitResult | null> {
  const normalizedApiKey = apiKey.trim()
  if (!normalizedApiKey) return null

  const apiKeyHash = hashIdentity(normalizedApiKey)
  const ipHash = clientIp ? hashIdentity(clientIp) : ""
  const apiKeyCacheKey = `api-key:${apiKeyHash}`
  const ipCacheKey = ipHash ? `ip:${ipHash}` : ""

  const cachedIpBan = ipCacheKey ? getCachedBan(ipCacheKey) : null
  if (cachedIpBan) return cachedIpBan

  const cachedApiKeyBan = getCachedBan(apiKeyCacheKey)
  if (cachedApiKeyBan) return cachedApiKeyBan

  const redisKeys = [
    `collector:rate:v1:requests:${apiKeyHash}`,
    `collector:rate:v1:api-key-ban:${apiKeyHash}`,
    `collector:rate:v1:api-key-ban-events:${apiKeyHash}`,
    `collector:rate:v1:ip-ban:${ipHash || "unavailable"}`,
  ]

  let result: [number, number]
  try {
    result = (await redis.eval(
      RATE_LIMIT_SCRIPT,
      4,
      ...redisKeys,
      randomUUID(),
      randomUUID(),
      String(REQUEST_WINDOW_MS),
      String(REQUEST_LIMIT),
      String(API_KEY_BAN_MS),
      String(BAN_HISTORY_WINDOW_MS),
      String(MAX_BAN_EVENTS),
      String(IP_BAN_MS),
      ipHash ? "1" : "0"
    )) as [number, number]
  } catch (error) {
    console.error("Collector rate limiter Redis check failed.", error)
    throw new CollectorRateLimiterUnavailableError()
  }

  const [resultCode, ttlMs] = result
  if (resultCode === 0) return null

  const retryAfterSeconds = Math.max(1, Math.ceil(ttlMs / 1000))
  if (resultCode === 2 && ipCacheKey) {
    cacheBan(ipCacheKey, "ip", ttlMs)
    return { scope: "ip", retryAfterSeconds }
  }

  cacheBan(apiKeyCacheKey, "api-key", ttlMs)
  return { scope: "api-key", retryAfterSeconds }
}
