import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import type { RecollectBookmark } from "@/lib/instagram/types";
import { onMessage, sendMessage } from "@/lib/messaging/protocol";
import { getChunkedArray, setChunkedArray } from "@/lib/storage/chunked";
import { syncState } from "@/lib/storage/items";
import { acquireLock, releaseLock } from "@/lib/sync/lock";
import {
  createErrorState,
  createIdleState,
  updateProgress,
} from "@/lib/sync/state";

const FETCHED_POSTS_KEY = "recollect:fetchedPosts";

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
        ...currentState,
        status: "fetching",
        cursor: null,
        fetched: 0,
        uploaded: 0,
        pauseReason: null,
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

      await sendMessage(
        "fetchSavedPosts",
        { cursor: currentState.cursor },
        tabs[0].id
      );

      return { success: true };
    });

    onMessage("cancelSync", async () => {
      await releaseLock();
      await syncState.setValue(createIdleState());
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
      await syncState.setValue(createIdleState());
      await releaseLock();
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
