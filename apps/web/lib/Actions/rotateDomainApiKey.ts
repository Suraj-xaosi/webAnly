"use server"

import { randomUUID } from "node:crypto"
import { prisma } from "@repo/db"
import { requireSession } from "./requireSession"
import { findOwnedDomain } from "./findOwnedDomain"
import { actionErr, actionOk } from "@repo/types/actionResult"

const ROTATION_COOLDOWN_SECONDS = 60
const ROTATION_COOLDOWNS = new Map<string, number>()

export async function rotateDomainApiKey(domainId: string) {
  try {
    const sessionResult = await requireSession(
      "You must be logged in to regenerate an API key."
    )
    if (!sessionResult.success) return actionErr(sessionResult.error)

    if (!domainId || domainId.trim().length === 0) {
      return actionErr("Domain ID cannot be empty.")
    }

    const domain = await findOwnedDomain(domainId, sessionResult.data.user.id, {
      id: true,
      apikey: true,
    })

    if (!domain) {
      return actionErr("Domain not found.")
    }

    const now = Date.now()
    const cooldownUntil = ROTATION_COOLDOWNS.get(domain.id) ?? 0
    if (cooldownUntil > now) {
      return actionErr(
        "This domain's API key was recently regenerated. Please wait 60 seconds before trying again."
      )
    }

    if (ROTATION_COOLDOWNS.size >= 20_000) {
      const oldestDomainId = ROTATION_COOLDOWNS.keys().next().value
      if (oldestDomainId) ROTATION_COOLDOWNS.delete(oldestDomainId)
    }
    ROTATION_COOLDOWNS.set(domain.id, now + ROTATION_COOLDOWN_SECONDS * 1000)

    const nextApiKey = randomUUID()

    const updated = await prisma.domain.updateMany({
      where: {
        id: domain.id,
        userId: sessionResult.data.user.id,
        apikey: domain.apikey,
      },
      data: { apikey: nextApiKey },
    })

    if (updated.count !== 1) {
      return actionErr(
        "The domain API key changed before regeneration completed. Refresh and try again."
      )
    }

    return actionOk(nextApiKey)
  } catch (error) {
    console.error("Error regenerating domain API key:", error)
    return actionErr("Something went wrong while regenerating the API key.")
  }
}
