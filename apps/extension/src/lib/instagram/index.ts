import { browser } from "wxt/browser";
import {
  CSRF_COOKIE_NAME,
  INSTAGRAM_DOMAIN,
  SESSION_COOKIE_NAME,
} from "./cookies";
import type { InstagramAuthState } from "./types";

export async function checkInstagramAuth(): Promise<InstagramAuthState> {
  try {
    const cookies = await browser.cookies.getAll({ domain: INSTAGRAM_DOMAIN });

    const csrfCookie = cookies.find((c) => c.name === CSRF_COOKIE_NAME);
    const sessionCookie = cookies.find((c) => c.name === SESSION_COOKIE_NAME);

    if (csrfCookie && sessionCookie) {
      return { isAuthenticated: true, csrfToken: csrfCookie.value };
    }

    return { isAuthenticated: false, csrfToken: null };
  } catch {
    return { isAuthenticated: false, csrfToken: null };
  }
}

export type { InstagramAuthState } from "./types";
