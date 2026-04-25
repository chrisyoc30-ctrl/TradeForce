/**
 * Admin session token (HMAC-SHA256) using Web Crypto only — works in Middleware
 * (Edge) and in Node API routes. Avoids `node:crypto`, which breaks Next.js webpack.
 */
const SALT = "tradescore-admin-session-v1";

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

export async function getExpectedAdminSessionToken(): Promise<string> {
  const p = process.env.ADMIN_PASSWORD ?? "";
  if (!p) return "";
  return hmacSha256Hex(p, SALT);
}

export async function verifyAdminSessionToken(
  token: string | undefined
): Promise<boolean> {
  const expected = await getExpectedAdminSessionToken();
  if (!expected || !token) return false;
  return timingSafeEqualHex(expected, token);
}
