import { browser } from "wxt/browser";

const CHUNK_SIZE = 500;

interface ChunkMetadata {
  totalChunks: number;
  totalItems: number;
}

export async function setChunkedArray<T>(
  keyPrefix: string,
  items: T[]
): Promise<void> {
  const totalChunks = Math.ceil(items.length / CHUNK_SIZE);
  const data: Record<string, T[] | ChunkMetadata> = {};

  data[`${keyPrefix}:meta`] = { totalChunks, totalItems: items.length };

  for (let i = 0; i < totalChunks; i++) {
    data[`${keyPrefix}:${i}`] = items.slice(
      i * CHUNK_SIZE,
      (i + 1) * CHUNK_SIZE
    );
  }

  await browser.storage.local.set(data);
}

export async function getChunkedArray<T>(keyPrefix: string): Promise<T[]> {
  const metaKey = `${keyPrefix}:meta`;
  const metaResult = await browser.storage.local.get(metaKey);

  const meta = metaResult[metaKey] as ChunkMetadata | undefined;
  if (!meta) {
    return [];
  }

  const keys = Array.from(
    { length: meta.totalChunks },
    (_, i) => `${keyPrefix}:${i}`
  );
  const chunks = await browser.storage.local.get(keys);

  return keys.flatMap((key) => (chunks[key] as T[]) ?? []);
}

export async function clearChunkedArray(keyPrefix: string): Promise<void> {
  const metaKey = `${keyPrefix}:meta`;
  const metaResult = await browser.storage.local.get(metaKey);

  const meta = metaResult[metaKey] as ChunkMetadata | undefined;
  if (!meta) {
    return;
  }

  const keysToRemove = [
    metaKey,
    ...Array.from({ length: meta.totalChunks }, (_, i) => `${keyPrefix}:${i}`),
  ];

  await browser.storage.local.remove(keysToRemove);
}
