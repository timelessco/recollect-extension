import type { SyncState } from "../storage/types";

export function createIdleState(): SyncState {
  return {
    status: "idle",
    cursor: null,
    fetched: 0,
    uploaded: 0,
    pauseReason: null,
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
