"use server"

import { prisma } from "@repo/db";
import { deleteCache } from "@repo/redis";
import { requireSession } from "./requireSession";
import { actionErr, actionOk } from "@/lib/shared/types/actionResult"

export async function deleteDomain(id: string) {
  try {
    const sessionResult = await requireSession("You must be logged in to delete a domain.")
    if (!sessionResult.success) return actionErr(sessionResult.error)

    if (!id || id.trim().length === 0) {
      return actionErr("Domain ID cannot be empty.")
    }

    const domain = await prisma.domain.findFirst({
      where: { id, userId: sessionResult.data.user.id },
      select: { id: true, apikey: true }
    });

    if (!domain) {
      return actionErr("Domain not found.")
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