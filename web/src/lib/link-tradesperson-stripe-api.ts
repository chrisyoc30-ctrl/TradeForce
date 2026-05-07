/**
 * Link Stripe customer (and optional subscription) to a tradesperson after
 * subscription Checkout completes (server-to-server).
 */
export async function linkTradespersonStripeInApi(opts: {
  tradeId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
}): Promise<{ ok: boolean; status: number; body: string }> {
  const base =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:5000";
  const secret = process.env.INTERNAL_WEBHOOK_SECRET;
  if (!secret) {
    return { ok: false, status: 503, body: "INTERNAL_WEBHOOK_SECRET not set" };
  }

  const body: Record<string, string | undefined> = {
    stripe_customer_id: opts.stripeCustomerId,
    stripe_subscription_id: opts.stripeSubscriptionId,
  };

  const res = await fetch(
    `${base.replace(/\/$/, "")}/api/internal/tradesperson/${encodeURIComponent(opts.tradeId)}/stripe-customer`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": secret,
      },
      body: JSON.stringify(body),
    }
  );

  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}
