import "server-only"
import { prisma } from "@repo/db"

const DAILY_TOKEN_LIMIT = 1000

function getTodayDate(): Date {
  const today = new Date()
  return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
}

export async function checkTokenBudget(
  domainId: string
): Promise<{ ok: boolean; used: number }> {
  const usageDate = getTodayDate()
  const usage = await prisma.aiTokenUsage.findUnique({
    where: { domainId_usageDate: { domainId, usageDate } },
    select: { tokens: true },
  })
  const used = usage?.tokens ?? 0
  return { ok: used < DAILY_TOKEN_LIMIT, used }
}

export async function recordTokenUsage(domainId: string, tokensUsed: number) {
  if (tokensUsed <= 0) return

  const usageDate = getTodayDate()
  await prisma.aiTokenUsage.upsert({
    where: { domainId_usageDate: { domainId, usageDate } },
    create: { domainId, usageDate, tokens: tokensUsed },
    update: { tokens: { increment: tokensUsed } },
  })
}
