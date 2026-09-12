import { NextRequest, NextResponse } from "next/server";
import { DIMENSION_COL_MAP, VALID_INTERVALS, type Interval } from "@/lib/shared/functions/analyticsConstants";
import type { Dimension } from "@/lib/shared/types/analytics";
import { validateDateParams } from "@/lib/shared/functions/TimeFunctions";
import { fetchDimensionTimeseriesData } from "@/lib/shared/functions/fetchDimensionTimeseriesData";
import { analyticsErrorResponse } from "@/lib/shared/functions/analyticsRouteUtils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domainId = searchParams.get("domainId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const dimension = searchParams.get("dimension");
    const value = searchParams.get("value");
    let interval = (searchParams.get("interval") || "hour") as Interval;
    if (from === to) interval = "hour";
    const timezone = searchParams.get("timezone") || "UTC";

    if (!domainId || !dimension || !value) {
      return NextResponse.json(
        { error: "domainId, dimension and value are required" },
        { status: 400 }
      );
    }
    if (!DIMENSION_COL_MAP[dimension as Dimension]) {
      return NextResponse.json(
        { error: `Invalid dimension. Allowed: ${Object.keys(DIMENSION_COL_MAP).join(", ")}` },
        { status: 400 }
      );
    }
    if (!VALID_INTERVALS.includes(interval)) {
      return NextResponse.json(
        { error: `Invalid interval. Allowed: ${VALID_INTERVALS.join(", ")}` },
        { status: 400 }
      );
    }

    const validationError = validateDateParams(from, to, timezone);
    if (validationError) return validationError;

    const response = await fetchDimensionTimeseriesData(
      domainId,
      dimension as Dimension,
      value,
      from!,
      to!,
      timezone,
      interval
    );
    return NextResponse.json(response);
  } catch (err) {
    return analyticsErrorResponse("dimension-timeseries", err);
  }
}
