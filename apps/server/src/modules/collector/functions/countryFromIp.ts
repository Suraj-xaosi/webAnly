
import { isIP } from 'node:net';
import { fileURLToPath } from 'node:url';
import { open, CityResponse, Reader } from 'maxmind';

let lookup: Reader<CityResponse> | null = null;
let initPromise: Promise<void> | null = null;

function initGeoIP(): Promise<void> {
  if (!initPromise) {
    const dbPath = fileURLToPath(
      new URL('../../../../GeoLite2-City.mmdb', import.meta.url)
    );
    initPromise = open<CityResponse>(dbPath)
      .then((reader) => {
        lookup = reader;
        console.info('GeoIP database loaded successfully.');
      })
      .catch((error: unknown) => {
        console.error(`Unable to load GeoIP database at ${dbPath}.`, error);
        throw error;
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
  console.log(`location from ip : ${ip}`)
  if (!ip || isIP(ip) === 0) {
    
    console.warn('GeoIP lookup skipped: client IP is missing or invalid.');
    return { city: "Unknown", country: "Unknown" };
  }
  if (isPrivateIp(ip)) {
    console.warn('GeoIP lookup skipped: client IP is private or local.');
    return { city: "Unknown", country: "Unknown" };
  }

  try {
    await initGeoIP();
    if (!lookup) return { city: "Unknown", country: "Unknown" };

    const result = lookup.get(ip);
    if (!result?.country?.names?.en && !result?.registered_country?.names?.en) {
      console.warn('GeoIP database has no country record for a public client IP.');
    }
    return {
      city: result?.city?.names?.en ?? "Unknown",
      country:
        result?.country?.names?.en ??
        result?.registered_country?.names?.en ??
        "Unknown",
    };
  } catch (error) {
    console.error('GeoIP lookup failed.', error);
    return { city: "Unknown", country: "Unknown" };
  }
}
