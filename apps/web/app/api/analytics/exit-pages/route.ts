import { NextRequest, NextResponse } from "next/server";
import { validateDateParams } from "@/lib/shared/functions/TimeFunctions";
import { fetchExitPagesData } from "@/lib/shared/functions/fetchExitPagesdata";
import { analyticsErrorResponse } from "@/lib/shared/functions/analyticsRouteUtils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domainId = searchParams.get("domainId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const timezone = searchParams.get("timezone") || "UTC";

    if (!domainId) {
      return NextResponse.json({ error: "domainId is required" }, { status: 400 });
    }

    const validationError = validateDateParams(from, to, timezone);
    if (validationError) return validationError;

    const response = await fetchExitPagesData(domainId, from!, to!, timezone);
    return NextResponse.json(response);
  } catch (err) {
    return analyticsErrorResponse("exit-pages", err);
  }
}
