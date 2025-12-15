import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth"; 
import { prisma } from "@repo/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;

    const userWithSites = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        sites: {
          select: {
            id: true,
            domain: true,
            createdAt: true
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!userWithSites) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(userWithSites.sites, { status: 200 });

  } catch (err) {
    console.error("GET /siteInfo error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
