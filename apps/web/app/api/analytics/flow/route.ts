import { NextRequest, NextResponse } from "next/server"
import { validateDateParams } from "@/app/api/analytics/_lib/TimeFunctions"
import { analyticsErrorResponse } from "@/app/api/analytics/_lib/analyticsRouteUtils"
import { fetchAllPageMapData } from "@/app/api/analytics/_lib/fetchAllPageMapData"
import { fetchFlowData } from "@/app/api/analytics/_lib/fetchFlowData"
import { ALL_PAGE_MAP_VALUE } from "@/types/analytics"
import { requireActiveDomainAccess } from "@/app/api/analytics/_lib/requireActiveDomainAccess"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const domainId = searchParams.get("domainId")
    const page = searchParams.get("page")
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const timezone = searchParams.get("timezone") || "UTC"

    if (!domainId || !page) {
      return NextResponse.json(
        { error: "domainId and page are required" },
        { status: 400 }
      )
    }
    const accessError = await requireActiveDomainAccess(req, domainId)
    if (accessError) return accessError

    const validationError = validateDateParams(from, to, timezone)
    if (validationError) return validationError

    if (page === ALL_PAGE_MAP_VALUE) {
      const response = await fetchAllPageMapData(domainId, from!, to!, timezone)
      return NextResponse.json(response)
    }

    const response = await fetchFlowData(domainId, page, from!, to!, timezone)
    return NextResponse.json(response)
  } catch (err) {
    return analyticsErrorResponse("flow", err)
  }
}
