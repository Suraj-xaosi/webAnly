
import dotenv           from "dotenv";
dotenv.config();
import express          from "express";
import { createServer } from "http";
import cors             from "cors";
import helmet           from "helmet";


import { collectorRouter }                    from "./modules/collector/index.js"
import { initWebSocketServer }                from "./modules/websocket/index.js";
import { startSpikeJob }                      from "./modules/spkies/index.js";
import { startDomainLifecycleJob }             from "./modules/domainLifeCycle/index.js";
import cron from "node-cron";
import { prisma } from "@repo/db";
import { errorHandler } from "./shared/middleware/errors.js";




const app        = express();
const httpServer = createServer(app);

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
  origin: true,
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json({ limit: "32kb" }));

app.use("/", collectorRouter);
app.use(errorHandler);
initWebSocketServer(httpServer);

async function start() {
  try {
    cron.schedule("* * * * *", async () => {
      try {
        await prisma.webSocketTicket.deleteMany({
          where: { expiresAt: { lte: new Date() } },
        });
      } catch (error) {
        console.error("WS TICKET CLEANUP: Failed to delete expired tickets", error);
      }
    });
    cron.schedule("5 0 * * *", async () => {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      yesterday.setUTCHours(0, 0, 0, 0);
      try {
        await prisma.aiTokenUsage.deleteMany({
          where: { usageDate: { lt: yesterday } },
        });
      } catch (error) {
        console.error("AI TOKEN CLEANUP: Failed to delete old usage records", error);
      }
    }, { timezone: "UTC" });
    await startSpikeJob();
    await startDomainLifecycleJob();
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