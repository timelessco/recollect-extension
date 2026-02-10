import { browser } from "wxt/browser";

const CHUNK_SIZE = 500;

type StorageArea = "local" | "session";

interface ChunkMetadata {
  totalChunks: number;
  totalItems: number;
}

function getStorage(area: StorageArea) {
  return browser.storage[area];
}

export async function setChunkedArray<T>(
  keyPrefix: string,
  items: T[],
  area: StorageArea = "local"
): Promise<void> {
  const storage = getStorage(area);
  const totalChunks = Math.ceil(items.length / CHUNK_SIZE);
  const data: Record<string, T[] | ChunkMetadata> = {};

  data[`${keyPrefix}:meta`] = { totalChunks, totalItems: items.length };

  for (let i = 0; i < totalChunks; i++) {
    data[`${keyPrefix}:${i}`] = items.slice(
      i * CHUNK_SIZE,
      (i + 1) * CHUNK_SIZE
    );
  }

  await storage.set(data);
}

export async function getChunkedArray<T>(
  keyPrefix: string,
  area: StorageArea = "local"
): Promise<T[]> {
  const storage = getStorage(area);
  const metaKey = `${keyPrefix}:meta`;
  const metaResult = await storage.get(metaKey);

  const meta = metaResult[metaKey] as ChunkMetadata | undefined;
  if (!meta) {
    return [];
  }

  const keys = Array.from(
    { length: meta.totalChunks },
    (_, i) => `${keyPrefix}:${i}`
  );
  const chunks = await storage.get(keys);

  return keys.flatMap((key) => (chunks[key] as T[]) ?? []);
}

export async function clearChunkedArray(
  keyPrefix: string,
  area: StorageArea = "local"
): Promise<void> {
  const storage = getStorage(area);
  const metaKey = `${keyPrefix}:meta`;
  const metaResult = await storage.get(metaKey);

  const meta = metaResult[metaKey] as ChunkMetadata | undefined;
  if (!meta) {
    return;
  }

  const keysToRemove = [
    metaKey,
    ...Array.from({ length: meta.totalChunks }, (_, i) => `${keyPrefix}:${i}`),
  ];

  await storage.remove(keysToRemove);
}
