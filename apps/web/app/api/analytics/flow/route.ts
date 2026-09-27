import { NextRequest, NextResponse } from "next/server"
import { validateDateParams } from "@/lib/shared/DBfunctions/helper/TimeFunctions"
import { analyticsErrorResponse } from "@/lib/shared/DBfunctions/helper/analyticsRouteUtils"
import { fetchAllPageMapData } from "@/lib/shared/DBfunctions/fetchAllPageMapData"
import { fetchFlowData } from "@/lib/shared/DBfunctions/fetchFlowData"
import { ALL_PAGE_MAP_VALUE } from "@/lib/shared/types/analytics"

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
