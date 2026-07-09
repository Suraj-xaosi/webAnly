// web/lib/actions/checkVisitor.ts
"use server";

import { prisma } from "@repo/db";
import { createHash } from "crypto";

function hashVisitorId(visitorId: string): string {
  return createHash("sha256").update(visitorId).digest("hex");
}

/**
 * Checks if a visitor has already been seen today in the DB.
 * visitorId here is the raw IP — we hash it before querying,
 * because dumpInDB.ts stores the hashed version.
 */
export async function checkVisitor(
  domainId: string,
  visitorId: string
): Promise<boolean> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const visit = await prisma.pageVisit.findFirst({
    where: {
      domainId,
      visitorId: hashVisitorId(visitorId),
      visitedAt: { gte: todayStart },
    },
    select: { id: true }, // only need existence, not full row
  });

  return visit !== null; // true = already seen today
}