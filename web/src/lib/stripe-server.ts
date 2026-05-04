import Stripe from "stripe";
import fetch from "node-fetch";

let stripe: Stripe | null = null;

/** Server-only Stripe client. Requires STRIPE_SECRET_KEY.
 *
 * Uses node-fetch as the HTTP transport to work around the
 * known stripe-node bug where the default undici-based fetch
 * fails on some hosts (Railway included).
 * Reference: https://github.com/stripe/stripe-node/issues/2538
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!stripe) {
    stripe = new Stripe(key, {
      // Use node-fetch instead of the default fetch implementation
      // to work around stripe-node connectivity bug.
      httpClient: Stripe.createFetchHttpClient(fetch as unknown as typeof globalThis.fetch),
      // Keep retries enabled — they help even more now connectivity is fixed.
      maxNetworkRetries: 2,
      timeout: 10000,
    });
  }
  return stripe;
}
