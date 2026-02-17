import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import { config } from "@/lib/config";
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

async function isPopupOpen(): Promise<boolean> {
  const contexts = await browser.runtime.getContexts({
    contextTypes: ["POPUP"],
  });
  return contexts.length > 0;
}

async function notifySyncResult(message: string): Promise<void> {
  if (await isPopupOpen()) {
    return;
  }
  await browser.notifications.create("sync-result", {
    type: "basic",
    iconUrl: browser.runtime.getURL("/icon/128.png"),
    title: "Recollect Sync",
    message,
  });
}

function formatSyncResultMessage(result: {
  type: string;
  syncedCount?: number;
}): string {
  return result.type === "success"
    ? `Synced ${result.syncedCount} new posts`
    : "Already up to date";
}

export default defineBackground({
  type: "module",
  main() {
    browser.notifications.onClicked.addListener((notificationId) => {
      browser.notifications.clear(notificationId);
      browser.tabs.create({ url: config.recollectUrl });
    });

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
        const resultState = await syncState.getValue();
        if (resultState.lastSyncResult) {
          await notifySyncResult(
            formatSyncResultMessage(resultState.lastSyncResult)
          );
        }
      } catch (error) {
        const state = await syncState.getValue();
        const errorMsg =
          error instanceof Error ? error.message : "Unknown upload error";
        await syncState.setValue(createErrorState(errorMsg, state));
        await notifySyncResult(errorMsg);
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
        const resultState = await syncState.getValue();
        if (resultState.lastSyncResult) {
          await notifySyncResult(
            formatSyncResultMessage(resultState.lastSyncResult)
          );
        }
      } catch (error) {
        const currentState = await syncState.getValue();
        const errorMsg =
          error instanceof Error ? error.message : "Unknown upload error";
        await syncState.setValue(createErrorState(errorMsg, currentState));
        await notifySyncResult(errorMsg);
        await releaseLock();
      }
    });

    onMessage("fetchError", async (message) => {
      const { type, message: errorMessage } = message.data;
      const currentState = await syncState.getValue();

      if (type === "auth") {
        await syncState.setValue(
          createPausedState("instagram_auth_expired", currentState)
        );
        await notifySyncResult("Instagram needs you to sign in");
      } else {
        await syncState.setValue(createErrorState(errorMessage, currentState));
        await notifySyncResult(errorMessage);
      }
      await releaseLock();
    });

    onMessage("retryWaiting", async (message) => {
      const { attempt, retryAt } = message.data;
      const currentState = await syncState.getValue();
      await syncState.setValue({
        ...currentState,
        retryInfo: { attempt, retryAt },
      });
    });

    onMessage("retryResumed", async () => {
      const currentState = await syncState.getValue();
      await syncState.setValue({
        ...currentState,
        retryInfo: null,
      });
    });

    console.log("[Recollect] Background service worker initialized");
  },
});
