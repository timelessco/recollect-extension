import type { AuthState } from "./types";
import { browser } from "wxt/browser";

import { config } from "../config";

import { combineChunks, parseSessionCookie } from "./cookies";
import { decodeJwtPayload } from "./jwt";

const AUTH_COOKIE_PATTERN = /^sb-[a-zA-Z0-9]+-auth-token(?:\.(\d+))?$/;

interface AuthCookie {
	name: string;
	value: string;
}

function parseAuthPayload(
	accessToken: string
): { userId: string; expiresAt: Date } | null {
	const payload = decodeJwtPayload(accessToken);

	if (typeof payload.exp !== "number" || typeof payload.sub !== "string") {
		return null;
	}

	return {
		expiresAt: new Date(payload.exp * 1000),
		userId: payload.sub,
	};
}

function extractBaseName(authCookies: AuthCookie[]): string {
	return authCookies[0].name.replace(/\.\d+$/, "");
}

async function fetchAuthCookies(): Promise<AuthCookie[]> {
	const cookies = await browser.cookies.getAll({
		domain: config.recollectDomain,
	});

	return cookies
		.filter((c): c is typeof c & { name: string; value: string } =>
			AUTH_COOKIE_PATTERN.test(c.name)
		)
		.map((c) => ({ name: c.name, value: c.value }));
}

function extractAndParseToken(
	authCookies: AuthCookie[]
): { userId: string; expiresAt: Date } | null {
	const baseName = extractBaseName(authCookies);
	const tokenValue = combineChunks(baseName, authCookies);

	if (tokenValue === null || tokenValue === "") {
		return null;
	}

	const session = parseSessionCookie(tokenValue);
	if (session === null || session.accessToken === "") {
		return null;
	}

	return parseAuthPayload(session.accessToken);
}

function determineAuthState(authCookies: AuthCookie[]): AuthState {
	if (authCookies.length === 0) {
		return { isAuthenticated: false, reason: "no_cookies" };
	}

	const parsed = extractAndParseToken(authCookies);
	if (parsed === null) {
		return { isAuthenticated: false, reason: "invalid" };
	}

	if (parsed.expiresAt < new Date()) {
		return { isAuthenticated: false, reason: "expired" };
	}

	return { isAuthenticated: true, ...parsed };
}

export async function checkAuthState(): Promise<AuthState> {
	const startTime = performance.now();

	try {
		const authCookies = await fetchAuthCookies();
		return determineAuthState(authCookies);
	} catch (error) {
		console.warn("[Auth] Failed to check auth state:", error);
		return { isAuthenticated: false, reason: "error" };
	} finally {
		if (config.isDev) {
			console.debug(`[Auth] Check took ${performance.now() - startTime}ms`);
		}
	}
}

export interface AuthDebugInfo {
	cookieCount: number;
	authCookieNames: string[];
	hasChunkedCookies: boolean;
	tokenPreview: string | null;
	checkDurationMs: number;
}

function buildTokenPreview(authCookies: AuthCookie[]): string | null {
	if (authCookies.length === 0) {
		return null;
	}

	if (!config.isDev) {
		return "[MASKED]";
	}

	const baseName = extractBaseName(authCookies);
	const value = combineChunks(baseName, authCookies);

	if (value === null || value === "") {
		return null;
	}

	return `${value.slice(0, 50)}...`;
}

export async function getAuthDebugInfo(): Promise<AuthDebugInfo> {
	const startTime = performance.now();

	const cookies = await browser.cookies.getAll({
		domain: config.recollectDomain,
	});

	const authCookies: AuthCookie[] = cookies
		.filter((c) => AUTH_COOKIE_PATTERN.test(c.name))
		.map((c) => ({ name: c.name, value: c.value }));

	const authCookieNames = authCookies.map((c) => c.name);
	const hasChunkedCookies = authCookies.some((c) => c.name.includes("."));

	return {
		authCookieNames,
		checkDurationMs: performance.now() - startTime,
		cookieCount: cookies.length,
		hasChunkedCookies,
		tokenPreview: buildTokenPreview(authCookies),
	};
}

export type {
	AuthState,
	AuthenticatedState,
	UnauthenticatedReason,
	UnauthenticatedState,
} from "./types";
