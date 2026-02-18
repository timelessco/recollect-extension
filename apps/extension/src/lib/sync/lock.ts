import { syncLock } from "../storage/items";

const LOCK_TIMEOUT_MS = 30_000;
const HEARTBEAT_INTERVAL_MS = 15_000;

export async function acquireLock(): Promise<boolean> {
  const lock = await syncLock.getValue();
  const now = Date.now();

  if (lock.isLocked && now - lock.heartbeat < LOCK_TIMEOUT_MS) {
    return false;
  }

  await syncLock.setValue({ isLocked: true, lockedAt: now, heartbeat: now });
  return true;
}

export async function releaseLock(): Promise<void> {
  await syncLock.setValue({ isLocked: false, lockedAt: 0, heartbeat: 0 });
}

export function startHeartbeat(): ReturnType<typeof setInterval> {
  return setInterval(async () => {
    const lock = await syncLock.getValue();
    if (lock.isLocked) {
      await syncLock.setValue({ ...lock, heartbeat: Date.now() });
    }
  }, HEARTBEAT_INTERVAL_MS);
}

export function stopHeartbeat(
  intervalId: ReturnType<typeof setInterval>
): void {
  clearInterval(intervalId);
}
