import { normalizeIp } from "./countryFromIp.js";
import { Request } from "express";

export default function getClientIp(req: Request): string {
  const xff = req.get("x-forwarded-for") || "";
  //@ts-ignore
  if (xff) return normalizeIp(xff.split(",")[0].trim());

  const xr = req.get("x-real-ip");
  if (xr) return normalizeIp(xr);

  if (req.ip) return normalizeIp(req.ip);

  // @ts-ignore
  return normalizeIp(req.connection?.remoteAddress || "0.0.0.0");
}