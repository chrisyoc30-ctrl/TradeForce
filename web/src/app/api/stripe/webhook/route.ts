import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe-server";
import { recordLeadPaymentInApi } from "@/lib/record-lead-payment";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured" },
      { status: 503 }
    );
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const leadId = pi.metadata?.leadId;
    if (leadId) {
      const result = await recordLeadPaymentInApi({
        leadId,
        paymentIntentId: pi.id,
        status: "succeeded",
        paidAt: new Date().toISOString(),
      });
      if (!result.ok) {
        console.error(
          "[stripe webhook] Failed to record payment in API:",
          result.status,
          result.body
        );
        return NextResponse.json(
          { error: "Failed to update lead in database", detail: result.body },
          { status: 502 }
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
