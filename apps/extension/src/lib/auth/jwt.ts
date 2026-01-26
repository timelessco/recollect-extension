function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function base64UrlToBase64(base64url: string): string {
  const base64 = base64url.replaceAll("-", "+").replaceAll("_", "/");
  const paddingLength = (4 - (base64.length % 4)) % 4;
  return base64.padEnd(base64.length + paddingLength, "=");
}

export function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT: expected 3 parts separated by '.'");
  }

  const [, payload] = parts;
  const decoded = atob(base64UrlToBase64(payload));
  const result: unknown = JSON.parse(decoded);

  if (!isPlainObject(result)) {
    throw new Error("Invalid JWT payload: expected object");
  }

  return result;
}
