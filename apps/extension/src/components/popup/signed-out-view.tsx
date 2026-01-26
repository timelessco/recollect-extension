import { Button } from "@repo/shadcn-ui/components/ui/button";
import { browser } from "wxt/browser";

import { config } from "@/lib/config";

import { PopupHeader } from "./popup-header";

async function openRecollectTab() {
  try {
    await browser.tabs.create({ url: config.recollectUrl });
  } catch {
    // Tab creation errors are non-critical - user can retry
  }
}

function handleSignIn() {
  // biome-ignore lint/complexity/noVoid: void marks fire-and-forget
  void openRecollectTab();
}

export function SignedOutView() {
  return (
    <div className="w-72 space-y-4 p-4">
      <PopupHeader />
      <p className="text-center text-muted-foreground text-sm">
        Sync your saved posts to Recollect
      </p>
      <Button className="w-full" onClick={handleSignIn} size="lg">
        Sign in to Recollect
      </Button>
    </div>
  );
}
