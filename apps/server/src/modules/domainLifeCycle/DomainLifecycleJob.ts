import cron from "node-cron";
import {runExpiryCheck} from "./jobs/runExpiryCheck.js";
import {runWarningCheck} from "./jobs/runWarningCheck.js";


export async function startDomainLifecycleJob() {
  cron.schedule("0 * * * *", async () => {
    await runExpiryCheck();
    await runWarningCheck();
  });

  console.log(
    "DOMAIN LIFECYCLE CRON: scheduled (hourly tick; expiry runs every tick, warning gated to ~once/day via redis lock)"
  );
}