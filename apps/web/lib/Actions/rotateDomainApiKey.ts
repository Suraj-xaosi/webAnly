"use server"

import { randomUUID } from "node:crypto"
import { prisma } from "@repo/db"
import { deleteCache, redis } from "@repo/redis"
import { requireSession } from "./requireSession"
import { findOwnedDomain } from "./findOwnedDomain"
import { actionErr, actionOk } from "@repo/types/actionResult"

const ROTATION_COOLDOWN_SECONDS = 60

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

    let cooldown: string | null
    try {
      cooldown = await redis.set(
        `domain:api-key-rotation:v1:${domain.id}`,
        "1",
        "EX",
        ROTATION_COOLDOWN_SECONDS,
        "NX"
      )
    } catch (error) {
      console.error("API key rotation rate limiter failed:", error)
      return actionErr(
        "API key regeneration is temporarily unavailable. Please try again later."
      )
    }

    if (cooldown !== "OK") {
      return actionErr(
        "This domain's API key was recently regenerated. Please wait 60 seconds before trying again."
      )
    }

    const nextApiKey = randomUUID()

    // Clear existing cached credentials before changing the database key.
    await deleteCache(`apikey:${domain.apikey}`)

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

    try {
      // Clear again in case a concurrent collector request repopulated the old key.
      await deleteCache(`apikey:${domain.apikey}`)
    } catch (error) {
      console.error(
        "Failed to invalidate the old API key cache after rotation:",
        error
      )
      return actionErr(
        "The API key was regenerated, but the old key cache could not be cleared. Refresh this page; the old key may remain valid briefly."
      )
    }

    return actionOk(nextApiKey)
  } catch (error) {
    console.error("Error regenerating domain API key:", error)
    return actionErr("Something went wrong while regenerating the API key.")
  }
}
