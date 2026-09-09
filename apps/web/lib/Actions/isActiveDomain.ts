"use server"

import { prisma } from "@repo/db"
import { requireSession } from "./requireSession"
import { actionErr, actionOk } from "@/lib/shared/types/actionResult"

export async function isActiveDomain(domainId: string) {
  try {
    if (!domainId || domainId.trim().length === 0) {
      return actionErr("Domain ID cannot be empty.")
    }

    const sessionResult = await requireSession("You must be logged in to see your domain access.")
    if (!sessionResult.success) return actionErr(sessionResult.error)

    const domain = await prisma.domain.findFirst({
      where: { id: domainId, userId: sessionResult.data.user.id },
      select: { state: true, defaultTimezone: true },
    })

    if (!domain) {
      return actionErr("Domain not found.")
    }

    return actionOk({ active: domain.state === "ACTIVE", timezone: domain.defaultTimezone })
  } catch (err) {
    console.error("isActiveDomain error:", err)
    return actionErr("Something went wrong while checking domain access.")
  }
}
