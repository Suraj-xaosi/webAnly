import { NextResponse } from "next/server";
import { Prisma } from "@repo/db";

export function getAnalyticsDateBounds(from: string, to: string, timezone: string) {
  return {
    lowerBoundSql: Prisma.sql`(${from}::date::timestamp AT TIME ZONE ${timezone})`,
    upperBoundSql: Prisma.sql`((${to}::date + INTERVAL '1 day')::timestamp AT TIME ZONE ${timezone})`,
  };
}

export function analyticsErrorResponse(scope: string, error: unknown): NextResponse {
  console.error(`[${scope}] error:`, error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
