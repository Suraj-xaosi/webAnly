
import { Router, Request, Response } from "express";
import { handleCollectEvent }        from "./collector.service.js";
import { asyncHandler } from "../../shared/middleware/asyncHandler.js";
import { collectorEventSchema } from "./collector.validation.js";

export const collectorRouter = Router();

collectorRouter.post("/collect", asyncHandler(async (req: Request, res: Response) => {
  const parsedBody = collectorEventSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({
      error: "Required fields are apikey, page, and a valid visitorId.",
    });
  }

  const stored = await handleCollectEvent(req, parsedBody.data);
  if (!stored) {
    return res.status(403).json({ error: "Request origin does not match the domain." });
  }

  return res.status(200).send("COLLECTOR : Event stored");
}));