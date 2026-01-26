import { useAsync, useMountEffect } from "@react-hookz/web";

import { PopupSkeleton } from "@/components/popup/popup-skeleton";
import { SignedInView } from "@/components/popup/signed-in-view";
import { SignedOutView } from "@/components/popup/signed-out-view";
import { checkAuthState } from "@/lib/auth";

type PopupState = "loading" | "signed-out" | "signed-in";

function usePopupAuthState(): PopupState {
  const [authResult, authActions] = useAsync(checkAuthState);

  useMountEffect(() => {
    // biome-ignore lint/complexity/noVoid: void marks fire-and-forget
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
