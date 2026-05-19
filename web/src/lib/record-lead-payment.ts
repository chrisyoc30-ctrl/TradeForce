/**
 * Notify Flask to persist Stripe payment on a lead (called from webhook).
 */
import { internalFlaskHeaders } from "@/lib/flask-internal-fetch";
import type { Lead } from "@/types/lead";

function apiBase(): string {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:5000"
  ).replace(/\/$/, "");
}

/** Resolve matched tradesperson from Flask so admin notify fires on paid accept. */
async function resolveMatchedTradespersonId(
  leadId: string,
): Promise<string | undefined> {
  try {
    const res = await fetch(
      `${apiBase()}/api/leads/${encodeURIComponent(leadId)}`,
      { cache: "no-store", headers: internalFlaskHeaders() },
    );
    if (!res.ok) {
      console.warn(
        "[record-lead-payment] Lead lookup failed:",
        res.status,
        leadId,
      );
      return undefined;
    }
    const lead = (await res.json()) as Lead & {
      matched_tradesperson_id?: string | null;
    };
    const tid = String(
      lead.matchedTradespersonId ?? lead.matched_tradesperson_id ?? "",
    ).trim();
    return tid || undefined;
  } catch (e) {
    console.warn("[record-lead-payment] Lead lookup error:", e);
    return undefined;
  }
}

export async function recordLeadPaymentInApi(opts: {
  leadId: string;
  paymentIntentId: string;
  status?: string;
  paidAt?: string;
  /** When omitted, looked up from Flask matched_tradesperson_id on the lead. */
  tradespersonId?: string;
}): Promise<{ ok: boolean; status: number; body: string }> {
  const secret = process.env.INTERNAL_WEBHOOK_SECRET;
  if (!secret) {
    return { ok: false, status: 503, body: "INTERNAL_WEBHOOK_SECRET not set" };
  }

  let tradespersonId = opts.tradespersonId?.trim();
  if (!tradespersonId) {
    tradespersonId = await resolveMatchedTradespersonId(opts.leadId);
  }

  const payload: Record<string, string> = {
    paymentIntentId: opts.paymentIntentId,
    status: opts.status ?? "succeeded",
    paidAt: opts.paidAt ?? new Date().toISOString(),
  };
  if (tradespersonId) {
    payload.tradespersonId = tradespersonId;
  }

  const res = await fetch(
    `${apiBase()}/api/internal/leads/${encodeURIComponent(opts.leadId)}/payment`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": secret,
      },
      body: JSON.stringify(payload),
    },
  );

  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}
