import { config } from "@/lib/config";
import type { RecollectBookmark } from "@/lib/instagram/types";

export class RecollectAuthError extends Error {
  constructor(message = "Recollect session expired") {
    super(message);
    this.name = "RecollectAuthError";
  }
}

interface SyncResponse {
  queued: number;
}

export async function uploadBatch(
  bookmarks: RecollectBookmark[],
  accessToken: string
): Promise<SyncResponse> {
  const response = await fetch(`${config.recollectUrl}/api/instagram/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ bookmarks }),
  });

  if (response.status === 401) {
    throw new RecollectAuthError();
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Recollect API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<SyncResponse>;
}
