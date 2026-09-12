import { NextRequest, NextResponse } from "next/server";
import { DIMENSION_COL_MAP } from "@/lib/shared/functions/analyticsConstants";
import type { Dimension } from "@/lib/shared/types/analytics";
import { validateDateParams } from "@/lib/shared/functions/TimeFunctions";
import { fetchDimensionData } from "@/lib/shared/functions/fetchDimensionData";
import { analyticsErrorResponse } from "@/lib/shared/functions/analyticsRouteUtils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domainId = searchParams.get("domainId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const dimension = searchParams.get("dimension");
    const timezone = searchParams.get("timezone") || "UTC";

    if (!domainId || !dimension) {
      return NextResponse.json(
        { error: "domainId and dimension are required" },
        { status: 400 }
      );
    }

    if (!DIMENSION_COL_MAP[dimension as Dimension]) {
      return NextResponse.json(
        { error: `Invalid dimension. Allowed: ${Object.keys(DIMENSION_COL_MAP).join(", ")}` },
        { status: 400 }
      );
    }

    const validationError = validateDateParams(from, to, timezone);
    if (validationError) return validationError;

    const response = await fetchDimensionData(
      domainId,
      dimension as Dimension,
      from!,
      to!,
      timezone
    );
    return NextResponse.json(response);
  } catch (err) {
    return analyticsErrorResponse("dimension", err);
  }
}
