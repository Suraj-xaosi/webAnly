export function extractRealIp(ip: string): string {
  if (!ip) return "";

  return ip.trim().replace("::ffff:", "");
}
