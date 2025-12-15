import { NextResponse } from "next/server";

/* helpers */
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomFrom = <T,>(arr: T[]) =>
  arr[Math.floor(Math.random() * arr.length)];

const randomIp = () =>
  `${rand(1, 255)}.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 255)}`;

const COLLECTOR_URL = "http://localhost:4000/collect";

/* mock data */
const urls = [
  "https://something.com",
  "https://something.com/pricing",
  "https://something.com/blog",
  "https://something.com/login",
];

const titles = ["Home", "Pricing", "Blog", "Login"];
const countries = ["India", "USA", "Germany", "UK", "Canada"];
const pages = ["/", "/pricing", "/blog", "/login"];
const referrers = ["google.com", "twitter.com", "direct"];
const browsers = ["Chrome", "Firefox", "Edge"];
const devices = ["Desktop", "Mobile"];
const osList = ["Windows", "MacOS", "Linux"];

export async function POST() {
  const payload = {
    eventType: "pageview",
    siteId: "3381f5ed-43fd-4f92-b8bd-4ba1604472d5",
    siteName: "HireMePlease.com",
    visitorId: String(rand(1, 20)),
    currentUrl: randomFrom(urls),
    pageTitle: randomFrom(titles),
    country: randomFrom(countries),
    page: randomFrom(pages),
    previousPage: randomFrom(referrers),
    browser: randomFrom(browsers),
    device: randomFrom(devices),
    os: randomFrom(osList),
    timeSpent: rand(5, 59),
    date: Date.now(),
    ipAddress: randomIp(),
  };

  try {
    const res = await fetch(COLLECTOR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({
      success: true,
      collectorStatus: res.status,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "collector unreachable" },
      { status: 500 }
    );
  }
}
