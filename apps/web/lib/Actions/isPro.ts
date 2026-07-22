// web/lib/Actions/isPro.ts
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@repo/db"
import { headers } from "next/headers"

export async function isPro(domainId: string) {
  try {
    if (!domainId || domainId.trim().length === 0) {
      return { error: "Domain ID cannot be empty." }
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return { error: "You must be logged in to see your api key." }
    }

    const domain = await prisma.domain.findFirst({
      where: {
        id: domainId,
        userId: session.user.id,
      },
      select: {
        pro: true,
        defaultTimezone: true,
      },
    })

    if (!domain) {
      return { error: "Domain not found." }
    }

    return { Pro: domain.pro, timezone: domain.defaultTimezone }
  } catch (err) {
    console.error("isPro error:", err)
    return { error: "Something went wrong while getting the isPro." }
  }
}