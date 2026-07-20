// web/lib/Actions/getApikey.ts
"use server"
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@repo/db";

export async function getApikey(domainId: string) {
  try {
    if (!domainId || domainId.trim().length === 0) {
      return { error: "Domain ID cannot be empty." };
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { error: "You must be logged in to see your api key." };
    }

    // Single query — find domain that belongs to this user
    const domain = await prisma.domain.findFirst({
      where: {
        id: domainId,
        userId: session.user.id,   // ownership check in the query itself
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