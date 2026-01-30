import { storage } from "wxt/storage";
import type { SyncedCodesData, SyncLock, SyncState } from "./types";

export const syncedPostCodes = storage.defineItem<SyncedCodesData>(
  "local:recollect:syncedCodes",
  {
    fallback: { version: 1, codes: [], lastSyncedAt: 0 },
  }
);

export const syncState = storage.defineItem<SyncState>(
  "session:recollect:syncState",
  {
    fallback: {
      status: "idle",
      cursor: null,
      fetched: 0,
      uploaded: 0,
      pauseReason: null,
    },
  }
);

export const syncLock = storage.defineItem<SyncLock>(
  "session:recollect:syncLock",
  {
    fallback: { isLocked: false, lockedAt: 0, heartbeat: 0 },
  }
);
