// apps/server/src/modules/websocket/functions/domainLock.ts (naya)

// Ek chhota sa per-domain lock — ensures seed and clear operations for the
// SAME domain never run at the same time. Different domains don't block
// each other (each gets its own lock entry).
const locks = new Map<string, Promise<void>>();

export async function withDomainLock<T>(domainId: string, fn: () => Promise<T>): Promise<T> {
  // Wait for whatever's currently running on this domain (if anything)
  const previous = locks.get(domainId) ?? Promise.resolve();

  let release!: () => void;
  const current = new Promise<void>((resolve) => (release = resolve));
  // Chain: this call now becomes "the thing running" for this domain
  locks.set(domainId, previous.then(() => current));

  await previous; // wait our turn

  try {
    return await fn();
  } finally {
    release();
    // Clean up if nobody's queued behind us, so the map doesn't grow forever
    if (locks.get(domainId) === previous.then(() => current)) {
      locks.delete(domainId);
    }
  }
}