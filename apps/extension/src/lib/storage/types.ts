export type SyncStatus = "idle" | "fetching" | "uploading" | "paused" | "error";

export interface SyncState {
  status: SyncStatus;
  cursor: string | null;
  fetched: number;
  uploaded: number;
  pauseReason: string | null;
}

export interface SyncedCodesData {
  version: 1;
  codes: string[];
  lastSyncedAt: number;
}

export interface SyncLock {
  isLocked: boolean;
  lockedAt: number;
  heartbeat: number;
}
