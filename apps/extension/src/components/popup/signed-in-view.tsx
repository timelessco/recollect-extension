import { Button } from "@repo/shadcn-ui/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { browser } from "wxt/browser";

import { config } from "@/lib/config";
import { sendMessage } from "@/lib/messaging/protocol";
import { syncedPostCodes, syncState } from "@/lib/storage/items";
import type { SyncState } from "@/lib/storage/types";

import { PopupHeader } from "./popup-header";

const IDLE_FALLBACK: SyncState = {
  status: "idle",
  cursor: null,
  fetched: 0,
  uploaded: 0,
  totalToUpload: 0,
  pauseReason: null,
  lastSyncResult: null,
};

function useSyncState(): SyncState {
  const [state, setState] = useState<SyncState>(IDLE_FALLBACK);

  useEffect(() => {
    syncState.getValue().then(setState);
    const unwatch = syncState.watch((newValue) => {
      setState(newValue);
    });
    return unwatch;
  }, []);

  return state;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

function useLastSyncedAt(): number {
  const [lastSyncedAt, setLastSyncedAt] = useState(0);

  useEffect(() => {
    syncedPostCodes.getValue().then((data) => {
      setLastSyncedAt(data.lastSyncedAt);
    });
  }, []);

  return lastSyncedAt;
}

function useCompletionMessage(state: SyncState): string | null {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (state.status !== "idle" || state.lastSyncResult === null) {
      return;
    }

    const result = state.lastSyncResult;
    const text =
      result.type === "success"
        ? `Synced ${result.syncedCount} new posts`
        : "Already up to date";

    setMessage(text);

    timerRef.current = setTimeout(() => {
      setMessage(null);
    }, 3000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [state.status, state.lastSyncResult]);

  return message;
}

function handleStartSync() {
  // biome-ignore lint/complexity/noVoid: void marks fire-and-forget
  void sendMessage("startSync", undefined);
}

function handleCancelSync() {
  // biome-ignore lint/complexity/noVoid: void marks fire-and-forget
  void sendMessage("cancelSync", undefined);
}

function handleResumeSync() {
  // biome-ignore lint/complexity/noVoid: void marks fire-and-forget
  void sendMessage("resumeSync", undefined);
}

function openRecollectTab() {
  // biome-ignore lint/complexity/noVoid: void marks fire-and-forget
  void browser.tabs.create({ url: config.recollectUrl });
}

function ProgressDisplay({
  label,
  onCancel,
}: {
  label: string;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-2 text-center">
      <div className="flex items-center justify-center gap-2">
        <LoaderCircle className="size-4 animate-spin" />
        <span className="text-muted-foreground text-sm">{label}</span>
      </div>
      <button
        className="text-muted-foreground text-xs hover:underline"
        onClick={onCancel}
        type="button"
      >
        Cancel
      </button>
    </div>
  );
}

function IdleView({
  completionMessage,
  lastSyncedAt,
}: {
  completionMessage: string | null;
  lastSyncedAt: number;
}) {
  if (completionMessage) {
    return (
      <p className="text-center text-muted-foreground text-sm">
        {completionMessage}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={handleStartSync} size="lg">
        Sync Instagram
      </Button>
      {lastSyncedAt > 0 && (
        <p className="text-center text-muted-foreground text-xs">
          Last synced: {formatTimeAgo(lastSyncedAt)}
        </p>
      )}
    </div>
  );
}

function PausedView({ pauseReason }: { pauseReason: string | null }) {
  if (pauseReason === "recollect_auth_expired") {
    return (
      <div className="space-y-2">
        <p className="text-center text-muted-foreground text-sm">
          Session expired. Sign in to Recollect to continue.
        </p>
        <Button className="w-full" onClick={openRecollectTab} size="lg">
          Sign in to Recollect
        </Button>
        <div className="text-center">
          <button
            className="text-muted-foreground text-xs hover:underline"
            onClick={handleResumeSync}
            type="button"
          >
            Resume
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={handleStartSync} size="lg">
        Sync Instagram
      </Button>
      <div className="text-center">
        <button
          className="text-muted-foreground text-xs hover:underline"
          onClick={handleResumeSync}
          type="button"
        >
          Resume
        </button>
      </div>
    </div>
  );
}

function ErrorView({ reason }: { reason: string | null }) {
  return (
    <div className="space-y-2">
      <p className="text-center text-destructive text-sm">
        {reason ?? "An error occurred"}
      </p>
      <Button className="w-full" onClick={handleStartSync} size="lg">
        Try again
      </Button>
    </div>
  );
}

export function SignedInView() {
  const state = useSyncState();
  const lastSyncedAt = useLastSyncedAt();
  const completionMessage = useCompletionMessage(state);

  const renderContent = useCallback(() => {
    switch (state.status) {
      case "idle": {
        return (
          <IdleView
            completionMessage={completionMessage}
            lastSyncedAt={lastSyncedAt}
          />
        );
      }
      case "fetching": {
        return (
          <ProgressDisplay
            label={`Fetching: ${state.fetched} posts...`}
            onCancel={handleCancelSync}
          />
        );
      }
      case "uploading": {
        return (
          <ProgressDisplay
            label={`Uploading: ${state.uploaded}/${state.totalToUpload}`}
            onCancel={handleCancelSync}
          />
        );
      }
      case "paused": {
        return <PausedView pauseReason={state.pauseReason} />;
      }
      case "error": {
        return <ErrorView reason={state.pauseReason} />;
      }
      default: {
        return (
          <IdleView completionMessage={null} lastSyncedAt={lastSyncedAt} />
        );
      }
    }
  }, [state, completionMessage, lastSyncedAt]);

  return (
    <div className="w-72 space-y-4 p-4">
      <PopupHeader />
      {renderContent()}
    </div>
  );
}
