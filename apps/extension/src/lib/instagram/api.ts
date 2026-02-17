import type {
  CollectionMap,
  InstagramMediaItem,
  SavedPostsPage,
} from "./types";

export class InstagramApiError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number) {
    super(`Instagram API error ${statusCode}`);
    this.name = "InstagramApiError";
    this.statusCode = statusCode;
  }
}

const IG_APP_ID = "936619743392459";
export const BASE_DELAY_MS = 1500;
export const COLLECTION_DELAY_MS = 500;
const JITTER_MS = 500;

const AUTO_COLLECTION_TYPES = new Set([
  "ALL_MEDIA_AUTO_COLLECTION",
  "AUDIO_AUTO_COLLECTION",
]);

const AUTO_COLLECTION_NAMES = new Set(["All Posts", "Audio"]);

interface SavedPostsResponse {
  items?: Array<{ media?: InstagramMediaItem }>;
  more_available?: boolean;
  next_max_id?: string;
}

interface CollectionItem {
  collection_id: string;
  collection_name: string;
  collection_type?: string;
}

interface CollectionsResponse {
  items?: CollectionItem[];
  more_available?: boolean;
  next_max_id?: string;
}

export function getCsrfToken(): string | null {
  return (
    document.cookie
      .split("; ")
      .find((c) => c.startsWith("csrftoken="))
      ?.split("=")[1] ?? null
  );
}

function getAuthHeaders(csrfToken: string): Record<string, string> {
  return {
    "X-CSRFToken": csrfToken,
    "X-IG-App-ID": IG_APP_ID,
    "X-Requested-With": "XMLHttpRequest",
  };
}

function requireCsrfToken(): string {
  const token = getCsrfToken();
  if (!token) {
    throw new Error("Not authenticated - csrftoken cookie missing");
  }
  return token;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(resolve, ms + Math.random() * JITTER_MS)
  );
}

export async function fetchSavedPostsPage(
  cursor: string | null
): Promise<SavedPostsPage> {
  const csrfToken = requireCsrfToken();

  const url = cursor
    ? `https://www.instagram.com/api/v1/feed/saved/posts/?max_id=${encodeURIComponent(cursor)}`
    : "https://www.instagram.com/api/v1/feed/saved/posts/";

  const response = await fetch(url, {
    headers: getAuthHeaders(csrfToken),
    credentials: "include",
  });

  if (!response.ok) {
    throw new InstagramApiError(response.status);
  }

  const data = (await response.json()) as SavedPostsResponse;

  const items: InstagramMediaItem[] = (data.items ?? [])
    .map((item) => item.media)
    .filter((media): media is InstagramMediaItem => media != null);

  return {
    items,
    hasMore: data.more_available === true,
    nextCursor: data.next_max_id ?? null,
  };
}

function isAutoCollection(item: CollectionItem): boolean {
  if (item.collection_type) {
    return AUTO_COLLECTION_TYPES.has(item.collection_type);
  }
  return AUTO_COLLECTION_NAMES.has(item.collection_name ?? "");
}

export async function fetchCollections(): Promise<CollectionMap> {
  const csrfToken = requireCsrfToken();
  const map: CollectionMap = new Map();
  let maxId: string | null = null;

  do {
    const params = new URLSearchParams({
      collection_types:
        '["ALL_MEDIA_AUTO_COLLECTION","PRODUCT_AUTO_COLLECTION","MEDIA"]',
    });
    if (maxId) {
      params.set("max_id", maxId);
    }

    const response = await fetch(
      `https://www.instagram.com/api/v1/collections/list/?${params.toString()}`,
      {
        headers: getAuthHeaders(csrfToken),
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new InstagramApiError(response.status);
    }

    const data = (await response.json()) as CollectionsResponse;

    for (const item of data.items ?? []) {
      if (isAutoCollection(item)) {
        continue;
      }
      map.set(String(item.collection_id), item.collection_name);
    }

    maxId = data.more_available ? (data.next_max_id ?? null) : null;

    if (maxId) {
      await delay(COLLECTION_DELAY_MS);
    }
  } while (maxId);

  return map;
}
