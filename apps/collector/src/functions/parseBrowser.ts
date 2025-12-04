export default function parseBrowser(ua: string): string {
    if (!ua) return "Unknown";
    if (/edg(e|A|)\/\d+/i.test(ua)) return "Edge";
    if (/opr\/|opera/i.test(ua)) return "Opera";
    if (/chrome\/\d+/i.test(ua) && !/edg/i.test(ua)) return "Chrome";
    if (/firefox\/\d+/i.test(ua)) return "Firefox";
    if (/safari\/\d+/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
    return "Unknown";
}