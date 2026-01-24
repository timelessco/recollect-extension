import { browser } from "wxt/browser";

import { Button } from "@/components/ui/button";
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
	// eslint-disable-next-line no-void -- void used to explicitly mark fire-and-forget
	void openRecollectTab();
}

export function SignedOutView() {
	return (
		<div className="w-72 space-y-4 p-4">
			<PopupHeader />
			<p className="text-muted-foreground text-center text-sm">
				Sync your saved posts to Recollect
			</p>
			<Button size="lg" className="w-full" onClick={handleSignIn}>
				Sign in to Recollect
			</Button>
		</div>
	);
}
