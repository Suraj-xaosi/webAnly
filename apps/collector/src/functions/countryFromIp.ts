import geoip from "geoip-lite";



export default function countryFromIp(ip: string): string {
    if (!ip || ip === "0.0.0.0" || ip.startsWith("127.") || ip === "localhost") {
        return "Unknown";
    }
    const geo = geoip.lookup(ip);
    const code = geo?.country || "";
    if (!code) return "Unknown";
    try {
        // Use Intl.DisplayNames to get the English country name from ISO code
        const name = new Intl.DisplayNames(["en"], { type: "region" }).of(code);
        return name || code;
    } catch {
        return code;
    }
}
export  function normalizeIp(raw: string): string {
    if (!raw) return "0.0.0.0";
    // remove port if present (IPv6 with port)
    const withoutPort = raw.split(":").length > 2 ? raw : raw.split(":").pop() || raw;
    // remove IPv6 prefix ::ffff:
    return withoutPort.replace(/^::ffff:/i, "");
}