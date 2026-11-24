
import dotenv           from "dotenv";
dotenv.config();
import express          from "express";
import { createServer } from "http";
import cors             from "cors";
import helmet           from "helmet";


import { collectorRouter }                    from "./modules/collector/index.js"
import { startSpikeJob }                      from "./modules/spkies/index.js";
import { errorHandler } from "./shared/middleware/errors.js";




const app        = express();
const httpServer = createServer(app);

app.set("trust proxy", 3);
app.use(helmet());

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean | string) => void) => {
    callback(null, origin || "*");
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-API-Key",
  ],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "32kb" }));

app.use("/", collectorRouter);
app.use(errorHandler);

async function start() {
  try {
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