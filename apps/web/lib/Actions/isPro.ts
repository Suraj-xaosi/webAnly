"use server"

import { prisma } from "@repo/db"
import { requireSession } from "./requireSession"
import { actionErr, actionOk } from "@/lib/shared/types/actionResult"

export async function isPro(domainId: string) {
  try {
    if (!domainId || domainId.trim().length === 0) {
      return actionErr("Domain ID cannot be empty.")
    }

    const sessionResult = await requireSession("You must be logged in to see your api key.")
    if (!sessionResult.success) return actionErr(sessionResult.error)

    const domain = await prisma.domain.findFirst({
      where: { id: domainId, userId: sessionResult.data.user.id },
      select: { pro: true, defaultTimezone: true },
    })

    if (!domain) {
      return actionErr("Domain not found.")
    }

    return actionOk({ pro: domain.pro, timezone: domain.defaultTimezone })
  } catch (err) {
    console.error("isPro error:", err)
    return actionErr("Something went wrong while getting the isPro.")
  }
}