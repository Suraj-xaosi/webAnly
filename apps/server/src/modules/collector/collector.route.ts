// src/modules/collector/collector.routes.ts
import { Router, Request, Response } from "express";
import { handleCollectEvent }        from "./collector.service";

export const collectorRouter = Router();

collectorRouter.post("/collect", async (req: Request, res: Response) => {
  const body = req.body || {};

  if (!body.apikey || !body.page) {
    return res.status(400).send("Missing required: apikey and page");
  }

  try {
    await handleCollectEvent(req);
    return res.status(200).send("Event sent to Kafka");
  } catch (err: any) {
    if (err.message === "DOMAIN_INACTIVE") {
      return res.status(403).json({ error: "Domain inactive" });
    }
    console.error("Error in /collect:", err);
    return res.status(500).send("Failed to send event to Kafka.");
  }
});