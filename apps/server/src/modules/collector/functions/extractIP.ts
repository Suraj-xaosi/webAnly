export function extractRealIp(ip: string): string {
  if (!ip) return "";
  console.log( ` extractIp file${ ip}`);
  return ip.trim().replace("::ffff:", "");
}
