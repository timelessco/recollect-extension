import { useAsync, useMountEffect } from "@react-hookz/web";

import { InstagramSignInView } from "@/components/popup/instagram-sign-in-view";
import { PopupSkeleton } from "@/components/popup/popup-skeleton";
import { SignedInView } from "@/components/popup/signed-in-view";
import { SignedOutView } from "@/components/popup/signed-out-view";
import { checkAuthState } from "@/lib/auth";
import { checkInstagramAuth } from "@/lib/instagram";

type PopupState = "loading" | "no-recollect" | "no-instagram" | "ready";

async function resolvePopupState(): Promise<PopupState> {
  const recollectAuth = await checkAuthState();
  if (!recollectAuth.isAuthenticated) {
    return "no-recollect";
  }

  const instagramAuth = await checkInstagramAuth();
  if (!instagramAuth.isAuthenticated) {
    return "no-instagram";
  }

  return "ready";
}

function usePopupAuthState(): PopupState {
  const [result, actions] = useAsync(resolvePopupState);

  useMountEffect(() => {
    // biome-ignore lint/complexity/noVoid: void marks fire-and-forget
    void actions.execute();
  });

  if (result.status === "loading" || result.status === "not-executed") {
    return "loading";
  }

  if (result.status === "success" && result.result !== undefined) {
    return result.result;
  }

  return "no-recollect";
}

export function Client() {
  const state = usePopupAuthState();

  switch (state) {
    case "loading": {
      return <PopupSkeleton />;
    }
    case "no-recollect": {
      return <SignedOutView />;
    }
    case "no-instagram": {
      return <InstagramSignInView />;
    }
    case "ready": {
      return <SignedInView />;
    }
    default: {
      return <SignedOutView />;
    }
  }
}
