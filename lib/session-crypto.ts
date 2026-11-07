// Admin session cookie ke liye HMAC-SHA256 signed token.
// Platform-agnostic (Node + Edge) — Web Crypto API use hoti hai.
// Token format: v1.<issuedAtMs>.<base64url(hmac)>
// Bina secret ke koi token forge nahi kar sakta.

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 din
const SESSION_VERSION = "v1";
const SESSION_MESSAGE = "admin-session";

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): Uint8Array {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function sign(secret: string, message: string): Promise<string> {
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message)
  );
  return toBase64Url(new Uint8Array(sig));
}

export async function createSessionToken(secret: string): Promise<string> {
  const issuedAt = String(Date.now());
  const sig = await sign(secret, `${SESSION_VERSION}.${issuedAt}.${SESSION_MESSAGE}`);
  return `${SESSION_VERSION}.${issuedAt}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
  secret: string
): Promise<boolean> {
  if (!token || !secret) return false;

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== SESSION_VERSION) return false;

  const [, issuedAt, sigB64] = parts;
  if (!/^\d+$/.test(issuedAt)) return false;

  const issuedAtMs = Number(issuedAt);
  if (Number.isNaN(issuedAtMs) || issuedAtMs <= 0) return false;

  // Token expire ho chuka?
  if (Date.now() - issuedAtMs > SESSION_TTL_MS) return false;

  const expected = await sign(secret, `${SESSION_VERSION}.${issuedAt}.${SESSION_MESSAGE}`);
  try {
    const a = fromBase64Url(sigB64);
    const b = fromBase64Url(expected);
    return constantTimeEqual(a, b);
  } catch {
    // Malformed base64 — forged/corrupt cookie ko 500 mat do, bas reject karo.
    return false;
  }
}
