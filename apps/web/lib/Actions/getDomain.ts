"use server"

import { prisma } from "@repo/db";
import { requireSession } from "./requireSession";
import { actionErr, actionOk } from "@/lib/shared/types/actionResult"

export async function getDomain() {
  try {
    const sessionResult = await requireSession("You must be logged in to see your domains.")
    if (!sessionResult.success) return actionErr(sessionResult.error)

    const email = sessionResult.data.user.email;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { domains: true },
    });

    if (!user) {
      return actionErr("User not found.")
    }

    return actionOk(user.domains)
  } catch (err: any) {
    console.error("getting DOMAIN ERROR:", err);
    return actionErr("Something went wrong while getting domain.")
  }
}