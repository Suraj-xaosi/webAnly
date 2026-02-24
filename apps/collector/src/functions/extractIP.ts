// Extract real IP from request
export function extractRealIp(ip: string | string[] | undefined): string {
  if (!ip) return "";

  if (Array.isArray(ip)) {
    ip = ip[0];
  }

  ip = String(ip).trim();

  if (ip.includes("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  if (ip.includes(":")) {
    ip = ip.split(":")[0];
  }

  return String(ip);
}

// Cache to store country lookups (avoid repeated API calls)
/*const countryCache: { [key: string]: string } = {};

// Get country name from IP using free ip-api service
export default async function countryFromIp(ipRaw: string): Promise<string> {
  if (!ipRaw) {
    return "Unknown";
  }

  const ip = extractRealIp(ipRaw);

  // Skip private/local IPs
  if (
    !ip ||
    ip === "0.0.0.0" ||
    ip.startsWith("127.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.")
  ) {
    return "Unknown";
  }

  
  if (countryCache[ip]) {
    return countryCache[ip];
  }

  try {
    
    const response = await fetch(`http://ip-api.com/json/${ip}`);

    
    if (!response.ok) {
      console.log("IP API error:", response.status);
      countryCache[ip] = "Unknown";
      return "Unknown";
    }

    const data = await response.json();

    // Check if API returned success
    if (data.status !== "success" || !data.country) {
      console.log("Could not find country for IP:", ip);
      countryCache[ip] = "Unknown";
      return "Unknown";
    }

    // Store country in cache and return
    const country = data.country;
    countryCache[ip] = country;
    return country;
  } catch (error) {
    console.error(`Error looking up country for IP ${ip}:`, error);
    countryCache[ip] = "Unknown";
    return "Unknown";
  }
}*/