"use server"

import { prisma, Prisma } from "@repo/db"

export function findOwnedDomain<T extends Prisma.DomainSelect>(
  domainId: string,
  userId: string,
  select: T,
): Promise<Prisma.DomainGetPayload<{ select: T }> | null> {
  return prisma.domain.findFirst({
    where: { id: domainId, userId },
    select,
  })
}
