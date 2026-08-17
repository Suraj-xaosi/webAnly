
import { Router, Request, Response } from "express";
import { handleCollectEvent }        from "./collector.service.js";

export const collectorRouter = Router();

collectorRouter.post("/collect", async (req: Request, res: Response) => {
  const body = req.body || {};

  if (!body.apikey || !body.page) {
    return res.status(400).send("COLLECTOR : Missing required - apikey and page");
  }

  try {
    await handleCollectEvent(req);

    console.log("COLLECTOR : Event sent to Kafka");
    return res.status(200).send("COLLECTOR : Event sent to Kafka");

  } catch (err) {
    console.error("COLLECTOR : Error in /collect:", err);
    return res.status(500).send("COLLECTOR : Failed to send event to Kafka.");
  }
});