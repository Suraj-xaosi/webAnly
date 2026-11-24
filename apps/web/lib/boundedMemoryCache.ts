interface CacheEntry {
  value: unknown
  expiresAt: number | null
}

const DEFAULT_MAX_ENTRIES = 1_000

function getMaxEntries(): number {
  const configured = Number(process.env.ANALYTICS_CACHE_MAX_ENTRIES)
  return Number.isFinite(configured) && configured > 0
    ? Math.floor(configured)
    : DEFAULT_MAX_ENTRIES
}

const globalCache = globalThis as unknown as {
  __analyticsMemoryCache?: Map<string, CacheEntry>
}

const cache = globalCache.__analyticsMemoryCache ?? new Map<string, CacheEntry>()
globalCache.__analyticsMemoryCache = cache

function deleteExpiredEntries(now: number): void {
  for (const [key, entry] of cache) {
    if (entry.expiresAt !== null && entry.expiresAt <= now) {
      cache.delete(key)
    }
  }
}

export function readFromMemoryCache<T>(key: string): T | null {
  const now = Date.now()
  const entry = cache.get(key)

  if (!entry) return null
  if (entry.expiresAt !== null && entry.expiresAt <= now) {
    cache.delete(key)
    return null
  }

  cache.delete(key)
  cache.set(key, entry)
  return entry.value as T
}

export function writeToMemoryCache(
  key: string,
  value: unknown,
  ttlSeconds?: number
): void {
  const now = Date.now()
  deleteExpiredEntries(now)

  cache.delete(key)
  cache.set(key, {
    value,
    expiresAt: ttlSeconds ? now + ttlSeconds * 1_000 : null,
  })

  const maxEntries = getMaxEntries()
  while (cache.size > maxEntries) {
    const oldestKey = cache.keys().next().value as string | undefined
    if (oldestKey === undefined) break
    cache.delete(oldestKey)
  }
}
