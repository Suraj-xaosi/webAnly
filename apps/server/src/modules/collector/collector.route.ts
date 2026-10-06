
import { Router, Request, Response } from "express";
import { handleCollectEvent }        from "./collector.service.js";
import {
  CollectorRateLimiterUnavailableError,
  type CollectorRateLimitResult,
} from "./functions/collectorRateLimiter.js";

export const collectorRouter = Router();

const VISITOR_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sendRateLimitResponse(res: Response, rateLimit: CollectorRateLimitResult) {
  res.setHeader("Retry-After", String(rateLimit.retryAfterSeconds));
  return res.status(429).json({
    error: "Collector temporarily rate-limited.",
    retryAfterSeconds: rateLimit.retryAfterSeconds,
  });
}

collectorRouter.post("/collect", async (req: Request, res: Response) => {
  const body = req.body || {};

  try {
    if (
      typeof body.apikey !== "string" ||
      !body.apikey.trim() ||
      typeof body.page !== "string" ||
      !body.page ||
      typeof body.visitorId !== "string" ||
      !VISITOR_ID_PATTERN.test(body.visitorId)
    ) {
      return res.status(400).send(
        "COLLECTOR : Required fields are apikey, page, and a valid visitorId"
      );
    }

    const rateLimit = await handleCollectEvent(req);
    if (rateLimit) return sendRateLimitResponse(res, rateLimit);

    return res.status(200).send("COLLECTOR : Event sent to Kafka");

  } catch (err) {
    if (err instanceof CollectorRateLimiterUnavailableError) {
      res.setHeader("Retry-After", "5");
      return res.status(503).json({
        error: "Collector rate limiter is temporarily unavailable. Retry shortly.",
      });
    }

    console.error("COLLECTOR : Error in /collect:", err);
    return res.status(500).send("COLLECTOR : Failed to send event to Kafka.");
  }
});