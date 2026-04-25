import { createHmac, timingSafeEqual } from "node:crypto";

const SALT = "tradescore-admin-session-v1";

export function getExpectedAdminSessionToken(): string {
  const p = process.env.ADMIN_PASSWORD ?? "";
  if (!p) return "";
  return createHmac("sha256", p).update(SALT).digest("hex");
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  const expected = getExpectedAdminSessionToken();
  if (!expected || !token) return false;
  try {
    const a = Buffer.from(token, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
