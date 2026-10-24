import { randomBytes, createHash } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@repo/db"
import { auth } from "@/lib/betterAuth/auth"

export const runtime = "nodejs"

const TICKET_TTL_SECONDS = 60

function getExpectedAppOrigin(): string | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL
  if (!appUrl) return null

  try {
    return new URL(appUrl).origin
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const expectedOrigin = getExpectedAppOrigin()
  const requestOrigin = request.headers.get("origin")

  if (!expectedOrigin || requestOrigin !== expectedOrigin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 })
  }

  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 })
  }

  let body: { domainId?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  if (typeof body.domainId !== "string" || !body.domainId.trim()) {
    return NextResponse.json({ error: "domainId is required." }, { status: 400 })
  }

  const domain = await prisma.domain.findFirst({
    where: {
      id: body.domainId,
      userId: session.user.id,
      deletedAt: null,
      state: "ACTIVE",
    },
    select: { id: true },
  })

  if (!domain) {
    return NextResponse.json({ error: "Domain not found or inactive." }, { status: 403 })
  }

  const ticket = randomBytes(32).toString("hex")
  const tokenHash = createHash("sha256").update(ticket).digest("hex")

  try {
    await prisma.webSocketTicket.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    })
    await prisma.webSocketTicket.create({
      data: {
        tokenHash,
        domainId: domain.id,
        origin: expectedOrigin,
        expiresAt: new Date(Date.now() + TICKET_TTL_SECONDS * 1000),
      },
    })
  } catch (error) {
    console.error("Failed to create WebSocket ticket:", error)
    return NextResponse.json({ error: "Unable to create WebSocket ticket." }, { status: 503 })
  }

  return NextResponse.json({ ticket })
}
