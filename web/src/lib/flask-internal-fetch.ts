/**
 * Headers Flask treats as trusted for server-to-server callers (Stripe bridge, emails).
 * Must match TradeScore-API INTERNAL_WEBHOOK_SECRET.
 */
export function internalFlaskHeaders(): Record<string, string> | undefined {
  const secret = process.env.INTERNAL_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return undefined;
  }
  return { "X-Internal-Secret": secret };
}
