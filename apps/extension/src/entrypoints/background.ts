import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import type { RecollectBookmark } from "@/lib/instagram/types";
import { onMessage, sendMessage } from "@/lib/messaging/protocol";
import { getChunkedArray, setChunkedArray } from "@/lib/storage/chunked";
import { syncedPostCodes, syncState } from "@/lib/storage/items";
import { acquireLock, releaseLock } from "@/lib/sync/lock";
import {
  createErrorState,
  createIdleState,
  createPausedState,
  updateProgress,
} from "@/lib/sync/state";
import { executeUpload, FETCHED_POSTS_KEY } from "@/lib/sync/upload";

export default defineBackground({
  type: "module",
  main() {
    onMessage("getSyncState", async () => {
      return await syncState.getValue();
    });

    onMessage("startSync", async () => {
      const lockAcquired = await acquireLock();
      if (!lockAcquired) {
        return { success: false, error: "Sync already in progress" };
      }

      const currentState = await syncState.getValue();
      await syncState.setValue({
        status: "fetching",
        cursor: null,
        fetched: 0,
        uploaded: 0,
        totalToUpload: 0,
        pauseReason: null,
        lastSyncResult: null,
        retryInfo: null,
      });

      const tabs = await browser.tabs.query({
        url: "*://*.instagram.com/*",
      });

      if (tabs.length === 0 || tabs[0].id == null) {
        await releaseLock();
        await syncState.setValue(createIdleState());
        return {
          success: false,
          error: "Open Instagram in a tab first",
        };
      }

      const syncedData = await syncedPostCodes.getValue();
      await sendMessage(
        "fetchSavedPosts",
        { cursor: currentState.cursor, syncedCodes: syncedData.codes },
        tabs[0].id
      );

      return { success: true };
    });

    onMessage("cancelSync", async () => {
      const currentState = await syncState.getValue();

      if (currentState.status === "uploading") {
        await syncState.setValue(createPausedState("cancelled", currentState));
        return;
      }

      await releaseLock();
      await syncState.setValue(createIdleState());
    });

    onMessage("resumeSync", async () => {
      const currentState = await syncState.getValue();
      if (currentState.status !== "paused") {
        return { success: false, error: "Sync is not paused" };
      }

      const lockAcquired = await acquireLock();
      if (!lockAcquired) {
        return { success: false, error: "Sync already in progress" };
      }

      try {
        await executeUpload();
      } catch (error) {
        const state = await syncState.getValue();
        const message =
          error instanceof Error ? error.message : "Unknown upload error";
        await syncState.setValue(createErrorState(message, state));
        await releaseLock();
      }

      return { success: true };
    });

    onMessage("postChunk", async (message) => {
      const { posts, cursor } = message.data;

      const existing = await getChunkedArray<RecollectBookmark>(
        FETCHED_POSTS_KEY,
        "session"
      );
      const combined = existing.concat(posts);
      await setChunkedArray(FETCHED_POSTS_KEY, combined, "session");

      const currentState = await syncState.getValue();
      await syncState.setValue({
        ...updateProgress(currentState, currentState.fetched + posts.length),
        cursor,
      });
    });

    onMessage("fetchComplete", async () => {
      try {
        await executeUpload();
      } catch (error) {
        const currentState = await syncState.getValue();
        const message =
          error instanceof Error ? error.message : "Unknown upload error";
        await syncState.setValue(createErrorState(message, currentState));
        await releaseLock();
      }
    });

    onMessage("fetchError", async (message) => {
      const { message: errorMessage } = message.data;
      const currentState = await syncState.getValue();
      await syncState.setValue(createErrorState(errorMessage, currentState));
      await releaseLock();
    });

    console.log("[Recollect] Background service worker initialized");
  },
});
