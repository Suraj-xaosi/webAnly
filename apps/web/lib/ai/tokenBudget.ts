import "server-only"
import { redis } from "@repo/redis"

const DAILY_TOKEN_LIMIT = 50_000 // per domain, per din — apni marzi se tune karo

function getTodayKey(domainId: string) {
  const today = new Date().toISOString().split("T")[0]
  return `ai-tokens:${domainId}:${today}`
}

export async function checkTokenBudget(domainId: string): Promise<{ ok: boolean; used: number }> {
  try {
    const used = Number((await redis.get(getTodayKey(domainId))) ?? 0)
    return { ok: used < DAILY_TOKEN_LIMIT, used }
  } catch (err) {
    console.error("[ai-tokenBudget] redis read failed:", err)
    return { ok: true, used: 0 } // Redis down ho toh feature block mat karo
  }
}

export async function recordTokenUsage(domainId: string, tokensUsed: number) {
  if (tokensUsed <= 0) return
  try {
    const key = getTodayKey(domainId)
    const newTotal = await redis.incrby(key, tokensUsed)
    if (newTotal === tokensUsed) {
      await redis.expire(key, 60 * 60 * 26) // 26 ghante buffer
    }
  } catch (err) {
    console.error("[ai-tokenBudget] redis write failed:", err)
  }
}