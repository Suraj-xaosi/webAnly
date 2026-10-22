import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/betterAuth/auth"
import { checkWebRateLimit } from "@/lib/rateLimit"

function getClientIp(request: NextRequest): string | null {
  const realIp = request.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp

  const forwardedFor = request.headers.get("x-forwarded-for")
  return forwardedFor?.split(",").at(-1)?.trim() || null
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
  const isServerAction =
    request.method === "POST" && request.headers.has("next-action")

  if (!pathname.startsWith("/api/") && !isServerAction) {
    return NextResponse.next()
  }

  if (
    pathname === "/api/webhook" ||
    pathname.startsWith("/api/webhook/") ||
    pathname === "/api/auth" ||
    pathname.startsWith("/api/auth/")
  ) {
    return NextResponse.next()
  }

  try {
    const session = await auth.api.getSession({ headers: request.headers })
    const identity = session?.user.id ?? getClientIp(request)
    if (!identity) {
      return NextResponse.json(
        { error: "Unable to determine client identity for rate limiting." },
        { status: 503 }
      )
    }

    const scope = session?.user.id ? "user" : "ip"
    const resource = isServerAction
      ? `action:${request.headers.get("next-action") ?? "unknown"}`
      : `api:${pathname}`
    const rateLimit = await checkWebRateLimit(scope, identity, resource)
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
