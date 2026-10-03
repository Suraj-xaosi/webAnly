
import { Router, Request, Response } from "express";
import { handleCollectEvent }        from "./collector.service.js";
import {
  CollectorRateLimiterUnavailableError,
  type CollectorRateLimitResult,
} from "./functions/collectorRateLimiter.js";

export const collectorRouter = Router();

function sendRateLimitResponse(res: Response, rateLimit: CollectorRateLimitResult) {
  res.setHeader("Retry-After", String(rateLimit.retryAfterSeconds));
  return res.status(429).json({
    error: "API key temporarily rate-limited.",
    retryAfterSeconds: rateLimit.retryAfterSeconds,
  });
}

collectorRouter.post("/collect", async (req: Request, res: Response) => {
  const body = req.body || {};

  try {
    if (!body.apikey || !body.page) {
      return res.status(400).send("COLLECTOR : Missing required - apikey and page");
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