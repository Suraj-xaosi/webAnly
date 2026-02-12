import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const siteId = searchParams.get("siteId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = Number(searchParams.get("limit") || 50);

    if (!siteId || !from || !to) {
      return NextResponse.json(
        { error: "siteId, from, and to are required" },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    // Get most common page-to-page transitions
    const flows = await prisma.$queryRaw<
      {
        fromPage: string | null;
        toPage: string;
        count: number;
      }[]
    >`
      SELECT
        "previousPage" AS "fromPage",
        page AS "toPage",
        COUNT(*)::int AS count
      FROM "DailyStat"
      WHERE
        "siteId" = ${siteId}
        AND "date" >= ${fromDate}
        AND "date" <= ${toDate}
        AND "previousPage" IS NOT NULL
      GROUP BY "previousPage", page
      ORDER BY count DESC
      LIMIT ${limit}
    `;

    return NextResponse.json({ data: flows });
  } catch (error) {
    console.error("Visitor flow API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}