"use server"

import { prisma } from "@repo/db"
import { requireSession } from "./requireSession"
import { actionErr, actionOk } from "@repo/types/actionResult"

export async function getDomainSummaries() {
  try {
    const sessionResult = await requireSession(
      "You must be logged in to see your domains."
    )
    if (!sessionResult.success) return actionErr(sessionResult.error)

    const domains = await prisma.domain.findMany({
      where: {
        userId: sessionResult.data.user.id,
        deletedAt: null,
      },
      select: {
        id: true,
        domainName: true,
        state: true,
        defaultTimezone: true,
        createdAt: true,
      },
    })

    return actionOk(domains)
  } catch (err) {
    console.error("getting DOMAIN SUMMARIES ERROR:", err)
    return actionErr("Something went wrong while getting domains.")
  }
}
