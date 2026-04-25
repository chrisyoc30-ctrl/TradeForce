/**
 * Notify Flask to persist Stripe payment on a lead (called from webhook).
 */
export async function recordLeadPaymentInApi(opts: {
  leadId: string;
  paymentIntentId: string;
  status?: string;
  paidAt?: string;
}): Promise<{ ok: boolean; status: number; body: string }> {
  const base =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:5000";
  const secret = process.env.INTERNAL_WEBHOOK_SECRET;
  if (!secret) {
    return { ok: false, status: 503, body: "INTERNAL_WEBHOOK_SECRET not set" };
  }

  const res = await fetch(
    `${base.replace(/\/$/, "")}/api/internal/leads/${encodeURIComponent(opts.leadId)}/payment`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": secret,
      },
      body: JSON.stringify({
        paymentIntentId: opts.paymentIntentId,
        status: opts.status ?? "succeeded",
        paidAt: opts.paidAt ?? new Date().toISOString(),
      }),
    }
  );

  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}
