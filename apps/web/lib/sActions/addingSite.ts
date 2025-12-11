"use server";

import prisma from "@repo/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth"

export async function addingSite(domain: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return { error: "Unauthorized. Please login." };
    }

    if (!domain || domain.trim().length === 0) {
      return { error: "Domain cannot be empty." };
    }
    domain = domain.trim().toLowerCase();


    const email = session.user.email;

    // 2. Fetch user along with sites
    const user = await prisma.user.findUnique({
      where: { email },
      include: { sites: true },
    });

    if (!user) {
      return { error: "User not found." };
    }

    // 3. Check limit: only 2 allowed
    if (user.sites.length >= 2) {
      return { error: "You can only add 2 sites." };
    }

    // 4. Check if domain already exists globally (your schema has unique domain)
    const existing = await prisma.site.findUnique({
      where: { domain },
    });

    if (existing) {
      return { error: "This domain is already in use." };
    }

    // 5. Create new site
    await prisma.site.create({
      data: {
        domain,
        userId: user.id,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error("ADD SITE ERROR:", err);

    // Prisma unique constraint error
    if (err.code === "P2002") {
      return { error: "Domain already exists." };
    }

    return { error: "Something went wrong while adding site." };
  }
}
