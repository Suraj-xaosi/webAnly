"use server"

import { prisma } from "@repo/db";
import { deleteCache } from "@repo/redis";
import { requireSession } from "./requireSession";
import { findOwnedDomain } from "./findOwnedDomain";
import { actionErr, actionOk } from "@/lib/shared/types/actionResult"

export async function deleteDomain(id: string) {
  try {
    const sessionResult = await requireSession("You must be logged in to delete a domain.")
    if (!sessionResult.success) return actionErr(sessionResult.error)

    if (!id || id.trim().length === 0) {
      return actionErr("Domain ID cannot be empty.")
    }

    const domain = await findOwnedDomain(id, sessionResult.data.user.id, { id: true, apikey: true });

    if (!domain) {
      return actionErr("Domain not found.")
    }

    const pendingPayment = await prisma.payment.findFirst({
      where: { domainId: domain.id, status: "PENDING" },
      select: { id: true },
    })

    if (pendingPayment) {
      return actionErr(
        "A payment for this domain is still processing. Please wait a few minutes before deleting."
      )
    }

    await prisma.domain.delete({ where: { id } });

    try {
      await deleteCache(`apikey:${domain.apikey}`);
    } catch (cacheError) {
      console.warn("Failed to invalidate deleted domain API key cache:", cacheError);
    }

    return actionOk(true)
  } catch (error) {
    console.error("Error deleting domain:", error);
    return actionErr("An error occurred while deleting the domain.")
  }
}