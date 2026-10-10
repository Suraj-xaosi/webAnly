
import { Router, Request, Response } from "express";
import { collectorEventSchema } from "@repo/types/validation";
import { handleCollectEvent }        from "./collector.service.js";
import type { CollectorRateLimitResult } from "./functions/collectorRateLimiter.js";
import { asyncHandler } from "../../shared/middleware/asyncHandler.js";

export const collectorRouter = Router();

function sendRateLimitResponse(res: Response, rateLimit: CollectorRateLimitResult) {
  res.setHeader("Retry-After", String(rateLimit.retryAfterSeconds));
  return res.status(429).json({
    error: "Collector temporarily rate-limited.",
    retryAfterSeconds: rateLimit.retryAfterSeconds,
  });
}

collectorRouter.post("/collect", asyncHandler(async (req: Request, res: Response) => {
  const parsedBody = collectorEventSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({
      error: "Required fields are apikey, page, and a valid visitorId.",
    });
  }

  const rateLimit = await handleCollectEvent(req, parsedBody.data);
  if (rateLimit) return sendRateLimitResponse(res, rateLimit);

  return res.status(200).send("COLLECTOR : Event sent to Kafka");
}));