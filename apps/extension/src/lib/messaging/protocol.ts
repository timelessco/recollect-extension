import { defineExtensionMessaging } from "@webext-core/messaging";
import type { SyncState } from "../storage/types";

interface ProtocolMap {
  // Popup -> Background
  startSync(): { success: true } | { success: false; error: string };
  cancelSync(): void;
  getSyncState(): SyncState;

  // Background -> Content Script (Phase 10)
  fetchSavedPosts(data: { cursor: string | null }): void;
  cancelFetch(): void;

  // Content Script -> Background (Phase 10)
  postChunk(data: {
    posts: unknown[];
    hasMore: boolean;
    cursor: string | null;
  }): void;
  fetchError(data: { type: string; message: string }): void;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
