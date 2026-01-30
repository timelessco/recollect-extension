import { syncLock } from "../storage/items";

const LOCK_TIMEOUT_MS = 30_000;

export async function acquireLock(): Promise<boolean> {
  const lock = await syncLock.getValue();
  const now = Date.now();

  // Check if existing lock is stale (heartbeat timeout)
  if (lock.isLocked && now - lock.heartbeat < LOCK_TIMEOUT_MS) {
    return false; // Another sync is active
  }

  // Acquire lock
  await syncLock.setValue({ isLocked: true, lockedAt: now, heartbeat: now });
  return true;
}

export async function refreshHeartbeat(): Promise<void> {
  const lock = await syncLock.getValue();
  if (lock.isLocked) {
    await syncLock.setValue({ ...lock, heartbeat: Date.now() });
  }
}

export async function releaseLock(): Promise<void> {
  await syncLock.setValue({ isLocked: false, lockedAt: 0, heartbeat: 0 });
}

export async function isLockActive(): Promise<boolean> {
  const lock = await syncLock.getValue();
  const now = Date.now();

  return lock.isLocked && now - lock.heartbeat < LOCK_TIMEOUT_MS;
}
