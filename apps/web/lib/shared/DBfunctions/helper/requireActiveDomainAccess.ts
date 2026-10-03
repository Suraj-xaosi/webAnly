import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@repo/db"
import { auth } from "@/lib/betterAuth/auth"

export async function requireActiveDomainAccess(
  request: NextRequest,
  domainId: string
): Promise<NextResponse | null> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 })
  }

  const domain = await prisma.domain.findFirst({
    where: { id: domainId, userId: session.user.id, deletedAt: null },
    select: { state: true },
  })

  if (!domain) {
    return NextResponse.json({ error: "Domain not found." }, { status: 404 })
  }

  if (domain.state !== "ACTIVE") {
    return NextResponse.json({ error: "This domain is currently deactivated." }, { status: 403 })
  }

  return null
}
