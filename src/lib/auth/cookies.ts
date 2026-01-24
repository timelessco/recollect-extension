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

export function parseSessionCookie(
	value: string
): { accessToken: string; refreshToken: string } | null {
	try {
		// Supabase stores: [access_token, refresh_token, null, null]
		const decoded = decodeURIComponent(value);
		const parsed: unknown = JSON.parse(decoded);

		if (Array.isArray(parsed) && typeof parsed[0] === "string") {
			const refreshToken = typeof parsed[1] === "string" ? parsed[1] : "";
			return {
				accessToken: parsed[0],
				refreshToken,
			};
		}
		return null;
	} catch {
		return null;
	}
}
