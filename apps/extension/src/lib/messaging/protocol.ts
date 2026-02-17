import { defineExtensionMessaging } from "@webext-core/messaging";
import type { RecollectBookmark } from "../instagram/types";
import type { SyncState } from "../storage/types";

interface ProtocolMap {
  // Popup -> Background
  startSync(): { success: true } | { success: false; error: string };
  cancelSync(): void;
  resumeSync(): { success: true } | { success: false; error: string };
  getSyncState(): SyncState;

  // Background -> Content Script
  fetchSavedPosts(data: { cursor: string | null; syncedCodes: string[] }): void;
  cancelFetch(): void;

  // Content Script -> Background
  postChunk(data: {
    posts: RecollectBookmark[];
    hasMore: boolean;
    cursor: string | null;
  }): void;
  fetchComplete(data: { totalFetched: number }): void;
  fetchError(data: {
    type: "rate_limit" | "auth" | "network" | "unknown";
    message: string;
  }): void;

  // Content Script -> Background (retry lifecycle)
  retryWaiting(data: { attempt: number; retryAt: number }): void;
  retryResumed(): void;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
