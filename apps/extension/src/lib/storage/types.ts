export type SyncStatus = "idle" | "fetching" | "uploading" | "paused" | "error";

export type SyncResult =
  | { type: "success"; syncedCount: number }
  | { type: "up-to-date" };

export interface RetryInfo {
  attempt: number;
  retryAt: number;
}

export interface SyncState {
  status: SyncStatus;
  cursor: string | null;
  fetched: number;
  uploaded: number;
  totalToUpload: number;
  pauseReason: string | null;
  lastSyncResult: SyncResult | null;
  retryInfo: RetryInfo | null;
  startedAt: number;
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
