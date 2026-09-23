import { NextRequest, NextResponse } from "next/server";
import { VALID_INTERVALS, type Interval } from "@/lib/shared/DBfunctions/helper/analyticsConstants";
import { validateDateParams } from "@/lib/shared/DBfunctions/helper/TimeFunctions";
import { fetchTimeseriesData } from "@/lib/shared/DBfunctions/fetchTimeseriesData";
import { analyticsErrorResponse } from "@/lib/shared/DBfunctions/helper/analyticsRouteUtils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domainId = searchParams.get("domainId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    let interval = (searchParams.get("interval") || "hour") as Interval;
    if (from === to) interval = "hour";
    const timezone = searchParams.get("timezone") || "UTC";

    if (!domainId) {
      return NextResponse.json({ error: "domainId is required" }, { status: 400 });
    }
    if (!VALID_INTERVALS.includes(interval)) {
      return NextResponse.json(
        { error: `Invalid interval. Allowed: ${VALID_INTERVALS.join(", ")}` },
        { status: 400 }
      );
    }

    const validationError = validateDateParams(from, to, timezone);
    if (validationError) return validationError;

    const response = await fetchTimeseriesData(domainId, from!, to!, timezone, interval);
    return NextResponse.json(response);
  } catch (err) {
    return analyticsErrorResponse("timeseries", err);
  }
}
