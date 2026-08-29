"use server"

import { prisma } from "@repo/db";
import { requireSession } from "./requireSession";

export async function getApikey(domainId: string) {
  try {
    if (!domainId || domainId.trim().length === 0) {
      return { error: "Domain ID cannot be empty." };
    }

    const { session, error } = await requireSession("You must be logged in to see your api key.")
    if (error) return { error }

    // Single query — find domain that belongs to this user
    const domain = await prisma.domain.findFirst({
      where: {
        id: domainId,
        userId: session?.user.id,   // ownership check in the query itself
      },
      select: {
        apikey: true,              // only pull what you need
      },
    });

    if (!domain) {
      // either doesn't exist or belongs to someone else — same error intentionally
      return { error: "Domain not found." };
    }

    return { apikey: domain.apikey };

  } catch (err) {
    console.error("getApikey error:", err);
    return { error: "Something went wrong while getting the api key." };
  }
}