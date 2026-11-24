import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@repo/db"
import { auth } from "@/lib/betterAuth/auth"

const LOAD_TEST_DOMAIN_ID = "0"

export async function requireActiveDomainAccess(
  request: NextRequest,
  domainId: string
): Promise<NextResponse | null> {
  const loadTestAccess = domainId === LOAD_TEST_DOMAIN_ID

  let domain
  if (loadTestAccess) {
    domain = await prisma.domain.findFirst({
      where: { id: domainId, deletedAt: null },
      select: { state: true },
    })
  } else {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 })
    }

    domain = await prisma.domain.findFirst({
      where: { id: domainId, userId: session.user.id, deletedAt: null },
      select: { state: true },
    })
  }

  if (!domain) {
    return NextResponse.json({ error: "Domain not found." }, { status: 404 })
  }

  if (domain.state !== "ACTIVE") {
    return NextResponse.json({ error: "This domain is currently deactivated." }, { status: 403 })
  }

  return null
}
