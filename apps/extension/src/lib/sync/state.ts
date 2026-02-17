import type { SyncResult, SyncState } from "../storage/types";

export function createIdleState(): SyncState {
  return {
    status: "idle",
    cursor: null,
    fetched: 0,
    uploaded: 0,
    totalToUpload: 0,
    pauseReason: null,
    lastSyncResult: null,
    retryInfo: null,
    startedAt: 0,
  };
}

export function createUploadingState(
  current: SyncState,
  totalToUpload: number
): SyncState {
  return {
    ...current,
    status: "uploading",
    totalToUpload,
  };
}

export function createCompletedIdleState(result: SyncResult): SyncState {
  return {
    ...createIdleState(),
    lastSyncResult: result,
  };
}

export function createPausedState(
  reason: string,
  current: SyncState
): SyncState {
  return {
    ...current,
    status: "paused",
    pauseReason: reason,
    retryInfo: null,
  };
}

export function createErrorState(
  reason: string,
  current: SyncState
): SyncState {
  return {
    ...current,
    status: "error",
    pauseReason: reason,
    retryInfo: null,
  };
}

export function updateProgress(
  state: SyncState,
  fetched?: number,
  uploaded?: number
): SyncState {
  return {
    ...state,
    fetched: fetched ?? state.fetched,
    uploaded: uploaded ?? state.uploaded,
  };
}
