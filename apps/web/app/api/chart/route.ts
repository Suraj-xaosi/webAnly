import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

type Stat = {
  id: string;
  siteId: string;
  date: Date;
  page: string;
  country: string | null;
  browser: string | null;
  device: string | null;
};

type StatArray = Stat[];

// ------------------------------
// Utility: Group By Key
// ------------------------------
function groupBy(rows: StatArray, key: keyof Stat) {
  const grouped: Record<string, number> = {};

  for (const row of rows) {
    const value = (row[key] as string) || "Unknown";
    grouped[value] = (grouped[value] || 0) + 1;
  }

  return Object.entries(grouped).map(([name, views]) => ({
    name,
    views,
  }));
}

// ------------------------------
// Utility: Views Per Hour
// ------------------------------
function hourlyViews(rows: StatArray) {
  const result = [];

  for (let hour = 0; hour < 24; hour++) {
    const count = rows.filter((row) => {
      return new Date(row.date).getHours() === hour;
    }).length;

    if (count > 0) {
      result.push({
        interval: `${hour}:00-${hour}:59`,
        views: count,
      });
    }
  }

  return result;
}

// ------------------------------
// GET /api/chart?domain=x&date=YYYY-MM-DD
// ------------------------------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain");
    const dateString = searchParams.get("date");

    if (!domain) {
      return NextResponse.json(
        { error: "domain is required" },
        { status: 400 }
      );
    }

    if (!dateString) {
      return NextResponse.json(
        { error: "date is required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    const startOfDay = new Date(dateString + "T00:00:00.000Z");
    const endOfDay = new Date(dateString + "T23:59:59.999Z");

    // Find site
    const site = await prisma.site.findUnique({
      where: { domain },
    });

    if (!site) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      );
    }

    // Fetch analytics for that day
    const rows: StatArray = await prisma.dailyStat.findMany({
      where: {
        siteId: site.id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No analytics data for this day" },
        { status: 404 }
      );
    }

    // Grouping
    const browsers = groupBy(rows, "browser");
    const devices = groupBy(rows, "device");
    const countries = groupBy(rows, "country");
    const pages = groupBy(rows, "page");

    const viewsData = hourlyViews(rows);

    return NextResponse.json({
      browsers,
      devices,
      countries,
      pages,
      viewsData,
    });
  } catch (err) {
    console.error("Error in /api/chart route:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
