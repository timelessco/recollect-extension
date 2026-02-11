import { Button } from "@repo/shadcn-ui/components/ui/button";
import { browser } from "wxt/browser";

import { PopupHeader } from "./popup-header";

async function openInstagramTab() {
  try {
    await browser.tabs.create({ url: "https://www.instagram.com/" });
  } catch {
    // Tab creation errors are non-critical - user can retry
  }
}

function handleSignIn() {
  // biome-ignore lint/complexity/noVoid: void marks fire-and-forget
  void openInstagramTab();
}

export function InstagramSignInView() {
  return (
    <div className="w-72 space-y-4 p-4">
      <PopupHeader />
      <p className="text-center text-muted-foreground text-sm">
        Sign in to Instagram to sync
      </p>
      <Button className="w-full" onClick={handleSignIn} size="lg">
        Sign in to Instagram
      </Button>
    </div>
  );
}
