import { NextResponse } from "next/server";
import { Prisma } from "@repo/db";
import { getCache, setCache } from "@repo/redis";
import {
  CACHE_TTL_PAST,
  CACHE_TTL_TODAY,
  todayInTimeZone,
} from "./TimeFunctions";

export function readCachedResponse<T>(cacheKey: string): Promise<T | null> {
  return getCache<T>(cacheKey);
}

export async function writeCachedResponse<T extends object>(
  cacheKey: string,
  responseBody: T,
  to: string,
  timezone: string
): Promise<void> {
  const ttl = to === todayInTimeZone(timezone) ? CACHE_TTL_TODAY : CACHE_TTL_PAST;
  await setCache(cacheKey, responseBody, ttl);
}

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
