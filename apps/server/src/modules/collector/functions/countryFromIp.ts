
import path from 'path';
import { isIP } from 'node:net';
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
  const normalizedIp = ip.toLowerCase();

  if (isIP(normalizedIp) === 4) {
    const [first, second] = normalizedIp.split(".").map(Number);
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 169 && second === 254) ||
      (first === 172 && second !== undefined && second >= 16 && second <= 31) ||
      (first === 192 && second === 168)
    );
  }

  return (
    normalizedIp === "::" ||
    normalizedIp === "::1" ||
    normalizedIp.startsWith("fc") ||
    normalizedIp.startsWith("fd") ||
    /^fe[89ab]/.test(normalizedIp)
  );
}
export async function locationFromIp(
  ip: string
): Promise<{ city: string; country: string }> {
  if (!ip) return { city: "Unknown", country: "Unknown" };
  if (isPrivateIp(ip)) return { city: "Unknown", country: "Unknown" };

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
