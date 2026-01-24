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

function buildTokenPreview(authCookies: AuthCookie[]): string | null {
	if (authCookies.length === 0) {
		return null;
	}

	const baseName = extractBaseName(authCookies);
	const value = combineChunks(baseName, authCookies);

	if (value === null || value === "") {
		return null;
	}

	return `${value.slice(0, 50)}...`;
}

async function saveDebugLog(
	durationMs: number,
	authCookies: AuthCookie[],
	result: AuthState
): Promise<void> {
	if (!config.isDev) {
		return;
	}

	await browser.storage.local.set({
		auth_debug: {
			cookieNames: authCookies.map((c) => c.name),
			durationMs: Math.round(durationMs),
			hasChunkedCookies: authCookies.some((c) => c.name.includes(".")),
			result,
			timestamp: new Date().toISOString(),
			tokenPreview: buildTokenPreview(authCookies),
		},
	});
}

export async function checkAuthState(): Promise<AuthState> {
	const startTime = performance.now();
	let authCookies: AuthCookie[] = [];

	try {
		authCookies = await fetchAuthCookies();
		const result = determineAuthState(authCookies);
		await saveDebugLog(performance.now() - startTime, authCookies, result);
		return result;
	} catch {
		const errorResult: AuthState = { isAuthenticated: false, reason: "error" };
		await saveDebugLog(performance.now() - startTime, authCookies, errorResult);
		return errorResult;
	}
}

export type {
	AuthState,
	AuthenticatedState,
	UnauthenticatedReason,
	UnauthenticatedState,
} from "./types";
