import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

const INTERVAL_DATE_TRUNC_MAP: Record<string, string> = {
  day: "day",
  week: "week",
  month: "month",
  hour: "hour",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const siteId = searchParams.get("siteId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const interval = searchParams.get("interval") || "hour";

    if (!siteId || !from || !to) {
      return NextResponse.json(
        { error: "siteId, from, and to are required" },
        { status: 400 }
      );
    }

    const dateTrunc = INTERVAL_DATE_TRUNC_MAP[interval];
    if (!dateTrunc) {
      return NextResponse.json(
        { error: "Invalid interval" },
        { status: 400 }
      );
    }

    let fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const rows = await prisma.$queryRaw<
      {
        date: Date;
        views: number;
        visitors: number;
      }[]
    >`
      SELECT
        date_trunc(${dateTrunc}, "date") AS date,
        COUNT(*)::int AS views,
        COUNT(DISTINCT "visitorId")::int AS visitors
      FROM "DailyStat"
      WHERE
        "siteId" = ${siteId}
        AND "date" >= ${fromDate}
        AND "date" <= ${toDate}
      GROUP BY 1
      ORDER BY 1 ASC
    `;
    console.log("Raw timeseries rows:", rows);
    function mapData() {
      if (interval === "hour"){
        return rows.map((row) => ({
          date: String(row.date.getHours()),
          views: row.views,
          visitors: row.visitors,
        }));
      }
      return rows.map((row) => ({
        date: row.date.toISOString().split("T")[0],
        views: row.views,
        visitors: row.visitors,
      }));
    }
    const data = mapData();
    console.log("TimeSeries data fetched:", { siteId, from, to, interval, data: data });

    return NextResponse.json({
      interval,
      data,
    });
  } catch (error) {
    console.error("Timeseries API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/*
    Example response:{
  "interval": "day",
  "data": [
    {
      "date": "2025-09-10",
      "views": 123,
      "visitors": 45
    }
  ]
}
    */

/*
Query Parameters:
siteId   (required)
from     (yyyy-mm-dd)
to       (yyyy-mm-dd)
interval = day | week | month
*/