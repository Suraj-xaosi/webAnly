import { withDomainLock } from "./domainLock.js";
import { seedDomain, clearDomainRedisData } from "./domainseed.js";

const GRACE_PERIOD_MS = 30 * 60 * 1000;

type DomainState = "seeding" | "ready";
const domainState = new Map<string, DomainState>();
const graceTimers = new Map<string, NodeJS.Timeout>();

export function isDomainReady(domainId: string): boolean {
  return domainState.get(domainId) === "ready";
}

export async function onDomainConnect(domainId: string, timezone: string): Promise<void> {
  const pendingTimer = graceTimers.get(domainId);
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    graceTimers.delete(domainId);
  }

  domainState.set(domainId, "seeding");

  await withDomainLock(domainId, async () => {
    try {
      await seedDomain(domainId, timezone);
      domainState.set(domainId, "ready");
    } catch (err) {
      console.error(`WS LIFECYCLE: Seed failed for domain ${domainId}`, err);
      // state stays "seeding" — skipped bug 3, not fixing this now
    }
  });
}

export function onDomainDisconnect(domainId: string, hasActiveClients: () => boolean): void {
  const existingTimer = graceTimers.get(domainId);
  if (existingTimer) clearTimeout(existingTimer);

  const timer = setTimeout(async () => {
    graceTimers.delete(domainId);
    if (hasActiveClients()) return; // reconnected during grace window

    await withDomainLock(domainId, async () => {
      // Re-check AGAIN inside the lock — a connect could have queued up
      // and be waiting its turn right now.
      if (hasActiveClients()) return;
      try {
        await clearDomainRedisData(domainId);
        domainState.delete(domainId);
      } catch (err) {
        console.error(`WS LIFECYCLE: Failed to clear Redis data for domain ${domainId}`, err);
      }
    });
  }, GRACE_PERIOD_MS);

  graceTimers.set(domainId, timer);
}