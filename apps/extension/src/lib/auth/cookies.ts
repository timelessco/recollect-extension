interface Cookie {
	name: string;
	value: string;
}

export function combineChunks(
	baseName: string,
	cookies: Cookie[]
): string | null {
	// Prefer non-chunked cookie if it exists
	const single = cookies.find((c) => c.name === baseName);
	if (single) {
		return single.value;
	}

	// Collect chunks sequentially starting at .0
	const chunks: string[] = [];
	for (let i = 0; ; i += 1) {
		const chunk = cookies.find((c) => c.name === `${baseName}.${i}`);
		if (!chunk) {
			break;
		}
		chunks.push(chunk.value);
	}

	return chunks.length > 0 ? chunks.join("") : null;
}

function isSessionObject(
	value: unknown
): value is { access_token: string; refresh_token?: string } {
	return (
		typeof value === "object" &&
		value !== null &&
		"access_token" in value &&
		typeof (value as Record<string, unknown>).access_token === "string"
	);
}

function decodeValue(value: string): string {
	if (value.startsWith("base64-")) {
		return atob(value.slice(7));
	}
	return decodeURIComponent(value);
}

function extractFromObject(
	parsed: unknown
): { accessToken: string; refreshToken: string } | null {
	if (!isSessionObject(parsed)) {
		return null;
	}
	return {
		accessToken: parsed.access_token,
		refreshToken: parsed.refresh_token ?? "",
	};
}

function extractFromArray(
	parsed: unknown
): { accessToken: string; refreshToken: string } | null {
	if (!Array.isArray(parsed) || typeof parsed[0] !== "string") {
		return null;
	}
	return {
		accessToken: parsed[0],
		refreshToken: typeof parsed[1] === "string" ? parsed[1] : "",
	};
}

export function parseSessionCookie(
	value: string
): { accessToken: string; refreshToken: string } | null {
	try {
		const decoded = decodeValue(value);
		const parsed: unknown = JSON.parse(decoded);

		return extractFromObject(parsed) ?? extractFromArray(parsed);
	} catch {
		return null;
	}
}
