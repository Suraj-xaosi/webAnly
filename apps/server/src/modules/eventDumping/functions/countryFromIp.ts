// src/modules/eventDumping/functions/countryFromIp.ts
const countryCache: { [key: string]: string } = {};

export default async function countryFromIp(ip: string): Promise<string> {
  if (!ip) return "Unknown";
  if (countryCache[ip]) return countryCache[ip];

  if (
    ip === "0.0.0.0"          ||
    ip === "::1"              ||
    ip.startsWith("127.")     ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.")      ||
    ip.startsWith("172.")
  ) {
    return "local";
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);

    if (!response.ok) {
      countryCache[ip] = "Unknown";
      return "Unknown";
    }

    const data = await response.json();

    if (data.status !== "success" || !data.country) {
      countryCache[ip] = "Unknown";
      return "Unknown";
    }

    countryCache[ip] = data.country;
    return data.country;

  } catch (error) {
    console.error(`Error looking up country for IP ${ip}:`, error);
    countryCache[ip] = "Unknown";
    return "Unknown";
  }
}