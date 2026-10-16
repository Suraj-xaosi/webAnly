import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/betterAuth/auth"
import { checkWebRateLimit } from "@/lib/rateLimit"

function getClientIp(request: NextRequest): string | null {
  const candidateHeaders = [
    "x-real-ip",
    "x-client-ip",
    "cf-connecting-ip",
    "x-forwarded-for",
  ]

  for (const headerName of candidateHeaders) {
    const rawHeader = request.headers.get(headerName)
    if (!rawHeader) continue

    const rawValues = headerName === "x-forwarded-for"
      ? rawHeader.split(",")
      : [rawHeader]

    const ip = rawValues
      .map((value) => value.trim())
      .filter(Boolean)
      .at(-1)

    if (ip) return ip
  }

  const forwarded = request.headers.get("forwarded")
  if (!forwarded) return null

  const forwardedFor = forwarded
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith("for="))

  if (!forwardedFor) return null

  const forValue = forwardedFor.split("=").at(1)?.replace(/"/g, "").trim()
  return forValue || null
}

function tooManyRequests(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    }
  )
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApiRequest = pathname.startsWith("/api/")
  const isServerAction =
    request.method === "POST" && request.headers.has("next-action")

  if (!isApiRequest && !isServerAction) return NextResponse.next()

  if (
    pathname === "/api/webhook" ||
    pathname.startsWith("/api/webhook/") ||
    pathname === "/api/auth" ||
    pathname.startsWith("/api/auth/")
  ) {
    return NextResponse.next()
  }

  try {
    const baseResource = isServerAction
      ? `action:${request.headers.get("next-action") ?? "unknown"}`
      : `api:${pathname}`
    let scope: "user" | "ip" = "ip"
    let identity = getClientIp(request)

    if (!identity) {
      return NextResponse.json(
        { error: "Unable to determine client identity for rate limiting." },
        { status: 503 }
      )
    }

    const session = await auth.api.getSession({ headers: request.headers })
    if (session?.user.id) {
      scope = "user"
      identity = session.user.id
    }

    const rateLimit = await checkWebRateLimit(scope, identity, baseResource)
    if (rateLimit.limited) {
      return tooManyRequests(rateLimit.retryAfterSeconds)
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Web request rate limiter failed.", error)
    return NextResponse.json(
      { error: "Request rate limiter is temporarily unavailable." },
      { status: 503, headers: { "Retry-After": "5" } }
    )
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
