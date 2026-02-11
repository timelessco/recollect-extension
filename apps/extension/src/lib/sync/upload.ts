import { getAccessToken } from "@/lib/auth";
import type { RecollectBookmark } from "@/lib/instagram/types";
import { RecollectAuthError, uploadBatch } from "@/lib/recollect/api";
import { clearChunkedArray, getChunkedArray } from "@/lib/storage/chunked";
import { syncedPostCodes, syncState } from "@/lib/storage/items";
import { releaseLock } from "@/lib/sync/lock";
import {
  createCompletedIdleState,
  createPausedState,
  createUploadingState,
  updateProgress,
} from "@/lib/sync/state";

const BATCH_SIZE = 500;

export const FETCHED_POSTS_KEY = "recollect:fetchedPosts";

function extractCodeFromUrl(url: string): string {
  const segments = url.split("/");
  const markerIndex = segments.findIndex((s) => s === "p" || s === "reel");
  if (markerIndex === -1 || markerIndex + 1 >= segments.length) {
    return url;
  }
  return segments[markerIndex + 1];
}

export async function executeUpload(): Promise<void> {
  const bookmarks = await getChunkedArray<RecollectBookmark>(
    FETCHED_POSTS_KEY,
    "session"
  );

  const syncedData = await syncedPostCodes.getValue();
  const syncedSet = new Set(syncedData.codes);
  const newBookmarks = bookmarks.filter(
    (b) => !syncedSet.has(extractCodeFromUrl(b.url))
  );

  if (newBookmarks.length === 0) {
    await syncState.setValue(createCompletedIdleState({ type: "up-to-date" }));
    await clearChunkedArray(FETCHED_POSTS_KEY, "session");
    await releaseLock();
    return;
  }

  const currentState = await syncState.getValue();
  await syncState.setValue(
    createUploadingState(currentState, newBookmarks.length)
  );

  let uploadedSoFar = 0;

  for (let i = 0; i < newBookmarks.length; i += BATCH_SIZE) {
    const batch = newBookmarks.slice(i, i + BATCH_SIZE);

    const token = await getAccessToken();
    if (!token) {
      const state = await syncState.getValue();
      await syncState.setValue(
        createPausedState("recollect_auth_expired", state)
      );
      return;
    }

    try {
      await uploadBatch(batch, token);
    } catch (error) {
      if (error instanceof RecollectAuthError) {
        const state = await syncState.getValue();
        await syncState.setValue(
          createPausedState("recollect_auth_expired", state)
        );
        return;
      }
      throw error;
    }

    const batchCodes = batch.map((b) => extractCodeFromUrl(b.url));
    const currentCodes = await syncedPostCodes.getValue();
    await syncedPostCodes.setValue({
      ...currentCodes,
      codes: [...currentCodes.codes, ...batchCodes],
      lastSyncedAt: Date.now(),
    });

    uploadedSoFar += batch.length;
    const state = await syncState.getValue();
    await syncState.setValue(updateProgress(state, undefined, uploadedSoFar));
  }

  await clearChunkedArray(FETCHED_POSTS_KEY, "session");
  await syncState.setValue(
    createCompletedIdleState({
      type: "success",
      syncedCount: uploadedSoFar,
    })
  );
  await releaseLock();
}
