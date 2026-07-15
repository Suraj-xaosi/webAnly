// apps/server/src/modules/collector/functions/countryFromIp.ts
import path from 'path';
import { open, CityResponse, Reader } from 'maxmind';

let lookup: Reader<CityResponse> | null = null;
let initPromise: Promise<void> | null = null;

function initGeoIP(): Promise<void> {
  if (!initPromise) {
    const dbPath = path.join(process.cwd(), 'GeoLite2-City.mmdb');
    initPromise = open<CityResponse>(dbPath).then((reader) => {
      lookup = reader;
    });
  }
  return initPromise;
}

function isPrivateIp(ip: string): boolean {
  return (
    ip === "0.0.0.0"          ||
    ip === "::1"              ||
    ip.startsWith("127.")     ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.")      ||
    ip.startsWith("172.")
  );
}

export default async function countryFromIp(ip: string): Promise<string> {
  if (!ip) return "Unknown";
  if (isPrivateIp(ip)) return "local";

  try {
    await initGeoIP();
    if (!lookup) return "Unknown";

    const result = lookup.get(ip);
    return result?.country?.names?.en ?? "Unknown";

  } catch (error) {
    console.error(`Error looking up country for IP ${ip}:`, error);
    return "Unknown";
  }
}

/*
// Future use: returns both city and country in one object.

export async function locationFromIp(
  ip: string
): Promise<{ city: string; country: string }> {
  if (!ip) return { city: "Unknown", country: "Unknown" };
  if (isPrivateIp(ip)) return { city: "local", country: "local" };

  try {
    await initGeoIP();
    if (!lookup) return { city: "Unknown", country: "Unknown" };

    const result = lookup.get(ip);
    return {
      city: result?.city?.names?.en ?? "Unknown",
      country: result?.country?.names?.en ?? "Unknown",
    };

  } catch (error) {
    console.error(`Error looking up location for IP ${ip}:`, error);
    return { city: "Unknown", country: "Unknown" };
  }
}
*/