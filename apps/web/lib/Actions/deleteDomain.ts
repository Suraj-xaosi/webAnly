"use server"

import { prisma } from "@repo/db"
import { requireSession } from "./requireSession"
import { findOwnedDomain } from "./findOwnedDomain"
import { actionErr, actionOk } from "@repo/types/actionResult"

export async function deleteDomain(id: string) {
  try {
    const sessionResult = await requireSession(
      "You must be logged in to delete a domain."
    )
    if (!sessionResult.success) return actionErr(sessionResult.error)

    if (!id || id.trim().length === 0) {
      return actionErr("Domain ID cannot be empty.")
    }

    const domain = await findOwnedDomain(id, sessionResult.data.user.id, {
      id: true,
    })

    if (!domain) {
      return actionErr("Domain not found.")
    }

    const deletion = await prisma.$transaction(async (tx) => {
      const domains = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id"
        FROM "domain"
        WHERE "id" = ${domain.id}
          AND "userId" = ${sessionResult.data.user.id}
        FOR UPDATE
      `
      const lockedDomain = domains[0]
      if (!lockedDomain) return { status: "not-found" as const }

      const pendingPayment = await tx.payment.findFirst({
        where: { domainId: lockedDomain.id, status: "PENDING" },
        select: { id: true },
      })

      if (pendingPayment) return { status: "payment-pending" as const }

      await tx.domain.delete({ where: { id: lockedDomain.id } })
      return { status: "deleted" as const }
    })

    if (deletion.status === "payment-pending") {
      return actionErr(
        "A payment for this domain is still processing. Please wait a few minutes before deleting."
      )
    }

    if (deletion.status === "not-found") {
      return actionErr("Domain not found.")
    }

    return actionOk(true)
  } catch (error) {
    console.error("Error deleting domain:", error)
    return actionErr("An error occurred while deleting the domain.")
  }
}
