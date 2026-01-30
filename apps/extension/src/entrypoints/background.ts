import { defineBackground } from "wxt/utils/define-background";
import { onMessage } from "@/lib/messaging/protocol";
import { syncState } from "@/lib/storage/items";
import { acquireLock, releaseLock } from "@/lib/sync/lock";
import { createIdleState } from "@/lib/sync/state";

export default defineBackground({
  type: "module",
  main() {
    // CRITICAL: Register ALL listeners synchronously at top level
    // Service worker can terminate and restart - no async in main()

    onMessage("getSyncState", async () => {
      return await syncState.getValue();
    });

    onMessage("startSync", async () => {
      const lockAcquired = await acquireLock();
      if (!lockAcquired) {
        return { success: false, error: "Sync already in progress" };
      }

      // TODO (Phase 10): Trigger content script fetch
      // For now, just return success to confirm lock works
      return { success: true };
    });

    onMessage("cancelSync", async () => {
      await releaseLock();
      await syncState.setValue(createIdleState());
    });

    // Content script handlers (Phase 10 will implement actual logic)
    onMessage("postChunk", async () => {
      // TODO: Process post chunk from content script
    });

    onMessage("fetchError", async () => {
      // TODO: Handle fetch error from content script
    });

    console.log("[Recollect] Background service worker initialized");
  },
});
