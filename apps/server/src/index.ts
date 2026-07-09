// server/src/index.ts
import dotenv           from "dotenv";
dotenv.config();
import express          from "express";
import { createServer } from "http";
import cors             from "cors";
//import dotenv           from "dotenv";

import { producer }                           from "./kafka/kafkaClient";
import { collectorRouter }                    from "./modules/collector";
import { initWebSocketServer }                from "./modules/websocket";
import { startWebSocketConsumer }             from "./modules/websocket";
import { startAnalyticsWorker, }              from "./modules/eventDumping";
import { startSpikeJob }                      from "./modules/spkies";
import { startNotificationWorker }            from "./modules/notifications";

//dotenv.config();

const app        = express();
const httpServer = createServer(app);

app.set("trust proxy", true);
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

app.use("/", collectorRouter);
initWebSocketServer(httpServer);

async function start() {
  if (!process.env.TOPIC_NAME) {
    console.error("TOPIC_NAME environment variable is required.");
    process.exit(1);
  }

  try {
    await producer.connect();

    await startAnalyticsWorker();
    await startNotificationWorker();
    await startWebSocketConsumer();
    await startSpikeJob(); // now async - connects to Kafka consumer

    httpServer.listen(4000, () => {
      console.log("🚀 Server running on port 4000");
    });
  } catch (err) {
    console.error("❌ Failed to start:", err);
    process.exit(1);
  }
}

start();