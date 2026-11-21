import { NextRequest, NextResponse } from "next/server";
import { validateDateParams } from "@/app/api/analytics/_lib/TimeFunctions";
import { fetchAllDimensionData } from "@/app/api/analytics/_lib/fetchDimensionData";
import { analyticsErrorResponse } from "@/app/api/analytics/_lib/analyticsRouteUtils";
import { requireActiveDomainAccess } from "@/app/api/analytics/_lib/requireActiveDomainAccess";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domainId = searchParams.get("domainId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const timezone = searchParams.get("timezone") || "UTC";

    if (!domainId) {
      return NextResponse.json(
        { error: "domainId is required" },
        { status: 400 }
      );
    }

    const accessError = await requireActiveDomainAccess(req, domainId);
    if (accessError) return accessError;

    const validationError = validateDateParams(from, to, timezone);
    if (validationError) return validationError;

    const response = await fetchAllDimensionData(
      domainId,
      from!,
      to!,
      timezone
    );
    return NextResponse.json(response);
  } catch (err) {
    return analyticsErrorResponse("dimensions", err);
  }
}
