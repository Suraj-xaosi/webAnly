import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/betterAuth/auth"
import { checkWebRateLimit } from "@/lib/rateLimit"
import { DIMENSION_COL_MAP } from "@/lib/shared/DBfunctions/helper/analyticsConstants"

function getClientIp(request: NextRequest): string | null {
  const realIp = request.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp

  const forwardedFor = request.headers.get("x-forwarded-for")
  const forwardedIp = forwardedFor?.split(",").at(-1)?.trim()
  return forwardedIp || null
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

  if (pathname === "/api/webhook" || pathname.startsWith("/api/webhook/")) {
    return NextResponse.next()
  }

  try {
    const isAuthRequest =
      pathname === "/api/auth" || pathname.startsWith("/api/auth/")
    const baseResource = isServerAction
      ? `action:${request.headers.get("next-action")}`
      : `api:${pathname}`
    const dimension =
      pathname === "/api/analytics/dimension"
        ? request.nextUrl.searchParams.get("dimension")
        : null
    const resource =
      dimension &&
      Object.prototype.hasOwnProperty.call(DIMENSION_COL_MAP, dimension)
        ? `${baseResource}:dimension:${dimension}`
        : baseResource
    let scope: "user" | "ip" = "ip"
    let identity = getClientIp(request)

    if (!isAuthRequest) {
      const session = await auth.api.getSession({ headers: request.headers })
      if (session?.user.id) {
        scope = "user"
        identity = session.user.id
      }
    }

    if (!identity) {
      return NextResponse.json(
        { error: "Unable to determine client identity for rate limiting." },
        { status: 503 }
      )
    }

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
