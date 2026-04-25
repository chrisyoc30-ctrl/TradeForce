type Entry = { resetAt: number; count: number };

const buckets = new Map<string, Entry>();

const WINDOW_MS = 60 * 60 * 1000;

export function checkRateLimit(
  key: string,
  maxAttempts: number
): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    b = { resetAt: now + WINDOW_MS, count: 0 };
    buckets.set(key, b);
  }
  if (b.count >= maxAttempts) {
    return { ok: false, retryAfterMs: Math.max(0, b.resetAt - now) };
  }
  b.count += 1;
  return { ok: true };
}
