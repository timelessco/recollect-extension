import { useAsync, useMountEffect } from "@react-hookz/web";
import { all } from "better-all";

import { PopupSkeleton } from "@/components/popup/popup-skeleton";
import { SignedInView } from "@/components/popup/signed-in-view";
import { SignedOutView } from "@/components/popup/signed-out-view";
import { checkAuthState } from "@/lib/auth";

type PopupState = "loading" | "signed-out" | "signed-in";

const MIN_LOADING_DELAY_MS = 200;

/* eslint-disable require-await, promise/avoid-new -- delay utility requires Promise constructor */
async function delay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
/* eslint-enable require-await, promise/avoid-new */

function usePopupAuthState(): PopupState {
	const [authResult, authActions] = useAsync(async () => {
		const { authState } = await all({
			// eslint-disable-next-line require-await -- arrow function returns Promise
			authState: async () => checkAuthState(),
			minDelay: async () => {
				await delay(MIN_LOADING_DELAY_MS);
			},
		});
		return authState;
	});

	useMountEffect(() => {
		// eslint-disable-next-line no-void -- void used to explicitly mark fire-and-forget
		void authActions.execute();
	});

	if (authResult.status === "loading" || authResult.status === "not-executed") {
		return "loading";
	}
	if (authResult.status === "success" && authResult.result !== undefined) {
		return authResult.result.isAuthenticated ? "signed-in" : "signed-out";
	}
	return "signed-out";
}

export function Client() {
	const state = usePopupAuthState();

	switch (state) {
		case "loading": {
			return <PopupSkeleton />;
		}
		case "signed-out": {
			return <SignedOutView />;
		}
		case "signed-in": {
			return <SignedInView />;
		}
		default: {
			return <SignedOutView />;
		}
	}
}
