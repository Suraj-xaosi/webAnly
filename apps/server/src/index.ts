
import dotenv           from "dotenv";
dotenv.config();
import express          from "express";
import { createServer } from "http";
import cors             from "cors";


import { producer }                           from "./shared/config/kafka/kafkaClient.js";
import { collectorRouter }                    from "./modules/collector/index.js"
import { initWebSocketServer }                from "./modules/websocket/index.js";
import { startWebSocketConsumer }             from "./modules/websocket/index.js";
import { startAnalyticsWorker, }              from "./modules/eventDumping/index.js";
import { startSpikeJob }                      from "./modules/spkies/index.js";
import { startNotificationWorker }            from "./modules/notifications/index.js";



const app        = express();
const httpServer = createServer(app);

app.set("trust proxy", true);
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

app.use("/", collectorRouter);
initWebSocketServer(httpServer);

async function start() {
  if (!process.env.TOPIC_NAME) {
    console.error(" SERVER START : TOPIC_NAME environment variable is required.");
    process.exit(1);
  }

  try {
    await producer.connect();

    await startWebSocketConsumer();
    await startAnalyticsWorker();
    await startNotificationWorker();
    
    await startSpikeJob(); 

    
    const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
    httpServer.listen(PORT, () => {
      console.log(` SERVER START : Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error(" SERVER START : Failed to start:", err);
    process.exit(1);
  }
}

start();