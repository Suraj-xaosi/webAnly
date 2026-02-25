const countryCache: { [key: string]: string } = {};


export default async function countryFromIp(ip: string): Promise<string> {
  if (!ip) {
   return "Unknown";
  }

  // Skip if IP is already cached
  if (countryCache[ip]) {
    return countryCache[ip];
   }

    // Skip private/local IPs
    if (!ip ||ip === "0.0.0.0" ||ip === "::1" || ip.startsWith("127.") ||ip.startsWith("192.168.") ||ip.startsWith("10.") ||ip.startsWith("172.")) {
      return "India";
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
}