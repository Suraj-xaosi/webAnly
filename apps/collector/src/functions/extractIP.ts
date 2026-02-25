// Extract real IP from request
export function extractRealIp(ip: string ): string {
  if (!ip) return "";

  if (Array.isArray(ip)) {
    ip = ip[0];
  }

  ip = String(ip).trim();

  if (ip.includes("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }


  return ip;
}

