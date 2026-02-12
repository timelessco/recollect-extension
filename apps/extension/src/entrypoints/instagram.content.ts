import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { defineContentScript } from "wxt/utils/define-content-script";
import {
  BASE_DELAY_MS,
  delay,
  fetchCollections,
  fetchSavedPostsPage,
} from "@/lib/instagram/api";
import { transformToBookmark } from "@/lib/instagram/transform";
import type {
  InstagramMediaItem,
  RecollectBookmark,
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

function classifyError(error: unknown): { type: string; message: string } {
  const isApiError =
    error instanceof Error && error.message.startsWith("Instagram API error");

  return {
    type: isApiError ? "api" : "unknown",
    message: error instanceof Error ? error.message : String(error),
  };
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

    const page = await fetchSavedPostsPage(currentCursor);
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
