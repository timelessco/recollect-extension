import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { defineContentScript } from "wxt/utils/define-content-script";
import {
  BASE_DELAY_MS,
  delay,
  fetchCollections,
  fetchSavedPostsPage,
  InstagramApiError,
} from "@/lib/instagram/api";
import { transformToBookmark } from "@/lib/instagram/transform";
import type {
  InstagramMediaItem,
  RecollectBookmark,
  SavedPostsPage,
} from "@/lib/instagram/types";
import { onMessage, sendMessage } from "@/lib/messaging/protocol";

function filterNewItems(
  items: InstagramMediaItem[],
  syncedCodesSet: Set<string>
): { newItems: InstagramMediaItem[]; boundaryHit: boolean } {
  const newItems: InstagramMediaItem[] = [];
  let boundaryHit = false;

  for (const item of items) {
    if (syncedCodesSet.has(item.code)) {
      boundaryHit = true;
      break;
    }
    newItems.push(item);
  }

  return { newItems, boundaryHit };
}

type ErrorType = "rate_limit" | "auth" | "network" | "unknown";

function classifyError(error: unknown): { type: ErrorType; message: string } {
  if (error instanceof InstagramApiError) {
    if (error.statusCode === 429) {
      return { type: "rate_limit", message: "Too many requests" };
    }
    if (error.statusCode === 401) {
      return { type: "auth", message: "Instagram needs you to sign in" };
    }
    return { type: "unknown", message: error.message };
  }
  if (error instanceof TypeError) {
    return { type: "network", message: "Connection lost" };
  }
  return {
    type: "unknown",
    message: error instanceof Error ? error.message : String(error),
  };
}

const RETRY_DELAYS = [30_000, 60_000, 120_000];

function interruptibleDelay(
  ms: number,
  isCancelled: () => boolean
): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(true), ms);
    const check = setInterval(() => {
      if (isCancelled()) {
        clearTimeout(timer);
        clearInterval(check);
        resolve(false);
      }
    }, 500);
    setTimeout(() => clearInterval(check), ms + 100);
  });
}

async function fetchWithRetry(
  currentCursor: string | null,
  isCancelled: () => boolean
): Promise<SavedPostsPage | null> {
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      return await fetchSavedPostsPage(currentCursor);
    } catch (error) {
      const isRetryable =
        (error instanceof InstagramApiError && error.statusCode === 429) ||
        error instanceof TypeError;

      if (!isRetryable || attempt >= RETRY_DELAYS.length) {
        throw error;
      }

      const delayMs = RETRY_DELAYS[attempt];
      const retryAt = Date.now() + delayMs;
      await sendMessage("retryWaiting", { attempt: attempt + 1, retryAt });

      const waited = await interruptibleDelay(delayMs, isCancelled);
      if (!waited) {
        return null;
      }

      await sendMessage("retryResumed", undefined);
    }
  }
  return null;
}

async function executeFetch(
  cursor: string | null,
  syncedCodes: string[],
  ctx: ContentScriptContext,
  isCancelled: () => boolean
): Promise<void> {
  const syncedCodesSet = new Set(syncedCodes);
  const collectionMap = await fetchCollections();

  let currentCursor = cursor;
  let totalFetched = 0;

  while (true) {
    if (isCancelled() || ctx.isInvalid) {
      break;
    }

    const page = await fetchWithRetry(currentCursor, isCancelled);
    if (!page) {
      return;
    }

    const { newItems, boundaryHit } = filterNewItems(
      page.items,
      syncedCodesSet
    );

    if (newItems.length > 0) {
      const bookmarks: RecollectBookmark[] = newItems.map((item) =>
        transformToBookmark(item, collectionMap)
      );
      totalFetched += bookmarks.length;

      await sendMessage("postChunk", {
        posts: bookmarks,
        hasMore: page.hasMore && !boundaryHit,
        cursor: page.nextCursor,
      });
    }

    if (boundaryHit || !page.hasMore || !page.nextCursor) {
      break;
    }

    currentCursor = page.nextCursor;
    await delay(BASE_DELAY_MS);
  }

  await sendMessage("fetchComplete", { totalFetched });
}

export default defineContentScript({
  matches: ["*://*.instagram.com/*"],
  runAt: "document_idle",

  main(ctx: ContentScriptContext) {
    let cancelled = false;

    onMessage("fetchSavedPosts", async (message) => {
      cancelled = false;
      try {
        await executeFetch(
          message.data.cursor,
          message.data.syncedCodes,
          ctx,
          () => cancelled
        );
      } catch (error) {
        await sendMessage("fetchError", classifyError(error));
      }
    });

    onMessage("cancelFetch", () => {
      cancelled = true;
    });
  },
});
