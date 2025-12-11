"use server";
import prisma from "@repo/db";

export async function removeSite(id: string) {
  await prisma.site.delete({ where: { id } });
}
