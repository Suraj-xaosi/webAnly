import cron from "node-cron";
import {runExpiryCheck} from "./jobs/runExpiryCheck.js";
import {runWarningCheck} from "./jobs/runWarningCheck.js";


export async function startDomainLifecycleJob() {
  cron.schedule("0 * * * *", async () => {
    try {
      await runExpiryCheck();
      await runWarningCheck();
    } catch (error) {
      console.error("DOMAIN LIFECYCLE CRON: Scheduled check failed", error);
    }
  });

  console.log("DOMAIN LIFECYCLE CRON: scheduled (hourly tick)");
}