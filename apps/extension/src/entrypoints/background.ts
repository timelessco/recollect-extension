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
  await browser.notifications.create(`sync-${Date.now()}`, {
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

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

let contentScriptReadyResolver: ((tabId: number) => void) | null = null;

function waitForContentScriptReady(
  expectedTabId: number,
  timeoutMs: number
): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      contentScriptReadyResolver = null;
      resolve(false);
    }, timeoutMs);

    contentScriptReadyResolver = (tabId) => {
      if (tabId === expectedTabId) {
        clearTimeout(timer);
        resolve(true);
      }
    };
  });
}

export default defineBackground({
  type: "module",
  main() {
    browser.notifications.onClicked.addListener((notificationId) => {
      browser.notifications.clear(notificationId);
      browser.tabs.create({ url: config.recollectUrl });
    });

    browser.runtime.onInstalled.addListener(async ({ reason }) => {
      if (reason !== "install" && reason !== "update") {
        return;
      }

      const instagramTabs = await browser.tabs.query({
        url: "*://*.instagram.com/*",
      });
      for (const tab of instagramTabs) {
        if (tab.id == null) {
          continue;
        }
        try {
          await browser.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["/content-scripts/instagram.js"],
          });
        } catch {
          // Tab may not be accessible (discarded, chrome:// page, etc.)
        }
      }
    });

    onMessage("contentScriptReady", ({ sender }) => {
      if (sender?.tab?.id != null && contentScriptReadyResolver) {
        contentScriptReadyResolver(sender.tab.id);
        contentScriptReadyResolver = null;
      }
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
        startedAt: Date.now(),
      });

      const tabs = await browser.tabs.query({
        url: "*://*.instagram.com/*",
      });

      let tabId: number;

      if (tabs.length > 0 && tabs[0].id != null) {
        tabId = tabs[0].id;
      } else {
        const newTab = await browser.tabs.create({
          url: "https://www.instagram.com/",
          active: false,
        });

        if (newTab.id == null) {
          await releaseLock();
          await syncState.setValue(
            createErrorState(
              "Failed to create Instagram tab",
              createIdleState()
            )
          );
          return { success: false, error: "Failed to create tab" };
        }

        tabId = newTab.id;
        const ready = await waitForContentScriptReady(tabId, 15_000);
        if (!ready) {
          await releaseLock();
          await syncState.setValue(
            createErrorState(
              "Instagram didn't load. Check your connection.",
              createIdleState()
            )
          );
          return {
            success: false,
            error: "Instagram tab timeout",
          };
        }
      }

      const syncedData = await syncedPostCodes.getValue();
      await sendMessage(
        "fetchSavedPosts",
        { cursor: currentState.cursor, syncedCodes: syncedData.codes },
        tabId
      );

      return { success: true };
    });

    onMessage("cancelSync", async () => {
      const currentState = await syncState.getValue();

      if (currentState.status === "uploading") {
        await syncState.setValue(createPausedState("cancelled", currentState));
        return;
      }

      const tabs = await browser.tabs.query({
        url: "*://*.instagram.com/*",
      });
      for (const tab of tabs) {
        if (tab.id != null) {
          await sendMessage("cancelFetch", undefined, tab.id).catch(
            () => undefined
          );
        }
      }

      await releaseLock();
      await syncState.setValue(createIdleState());
    });

    onMessage("resumeSync", async () => {
      const currentState = await syncState.getValue();
      if (currentState.status !== "paused") {
        return { success: false, error: "Sync is not paused" };
      }

      if (
        currentState.startedAt > 0 &&
        Date.now() - currentState.startedAt > TWENTY_FOUR_HOURS
      ) {
        await syncState.setValue(createIdleState());
        return {
          success: false,
          error: "Sync expired. Please start a new sync.",
        };
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
  },
});
