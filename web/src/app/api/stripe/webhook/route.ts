import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  descriptionExcerpt,
  projectTypeLabel,
} from "@/components/leads/lead-helpers";
import {
  getLeadDetailUrl,
  sendPaymentConfirmationEmail,
} from "@/emails/email-service";
import { getStripe } from "@/lib/stripe-server";
import { recordLeadPaymentInApi } from "@/lib/record-lead-payment";
import { TRADESMAN_LEAD_PRICE_GBP } from "@/lib/pricing";
import type { Lead } from "@/types/lead";

function paymentIntentIdFromCheckoutSession(
  session: Stripe.Checkout.Session,
): string | null {
  const pi = session.payment_intent;
  if (typeof pi === "string" && pi.length > 0) {
    return pi;
  }
  if (pi && typeof pi === "object" && "id" in pi) {
    return (pi as Stripe.PaymentIntent).id;
  }
  return null;
}

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

      const tradesmanEmail = pi.metadata?.tradesmanEmail?.trim();
      const tradesmanName = pi.metadata?.tradesmanName?.trim();
      if (tradesmanEmail && tradesmanName) {
        const amountGbp = (pi.amount ?? 0) / 100;
        const leadTitle = pi.metadata?.leadTitle || "Project";
        const homeownerName = pi.metadata?.homeownerName || "Your client";
        const projectSummary = pi.metadata?.projectSummary || undefined;
        const dashboardUrl = getLeadDetailUrl(leadId);
        try {
          await sendPaymentConfirmationEmail({
            tradesmanEmail,
            tradesmanName,
            leadId,
            leadTitle,
            amountGbp: amountGbp > 0 ? amountGbp : TRADESMAN_LEAD_PRICE_GBP,
            homeownerName,
            projectSummary,
            dashboardUrl,
          });
          console.log(
            "[stripe webhook] Payment confirmation email logged for:",
            tradesmanEmail
          );
        } catch (emailError) {
          console.error(
            "[stripe webhook] Payment confirmation email failed (ignored):",
            emailError
          );
        }
      } else {
        console.warn(
          "[stripe webhook] Missing tradesmanEmail/tradesmanName in metadata; skip confirmation email"
        );
      }
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const leadId = session.client_reference_id?.trim();
    const paymentIntentId = paymentIntentIdFromCheckoutSession(session);
    if (leadId && paymentIntentId) {
      const result = await recordLeadPaymentInApi({
        leadId,
        paymentIntentId,
        status: "succeeded",
        paidAt: new Date().toISOString(),
      });
      if (!result.ok) {
        console.error(
          "[stripe webhook] checkout.session.completed: failed to record payment:",
          result.status,
          result.body,
        );
        return NextResponse.json(
          { error: "Failed to update lead in database", detail: result.body },
          { status: 502 },
        );
      }

      const tradesmanEmail = session.customer_details?.email?.trim();
      const tradesmanName =
        session.customer_details?.name?.trim() ?? "Customer";

      let leadTitle = "Project";
      let homeownerName = "Your client";
      let projectSummary: string | undefined;
      const apiBase =
        process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";
      if (apiBase) {
        try {
          const leadRes = await fetch(
            `${apiBase.replace(/\/$/, "")}/api/leads/${encodeURIComponent(leadId)}`,
            { cache: "no-store" },
          );
          if (leadRes.ok) {
            const lead = (await leadRes.json()) as Lead;
            leadTitle = projectTypeLabel(lead);
            homeownerName =
              (lead.name && lead.name.trim()) || "Your client";
            projectSummary = descriptionExcerpt(lead, 200);
          }
        } catch (e) {
          console.warn("[stripe webhook] lead fetch for email skipped:", e);
        }
      }

      if (tradesmanEmail && tradesmanName) {
        const amountTotal = session.amount_total ?? 0;
        const amountGbp = amountTotal > 0 ? amountTotal / 100 : TRADESMAN_LEAD_PRICE_GBP;
        const dashboardUrl = getLeadDetailUrl(leadId);
        try {
          await sendPaymentConfirmationEmail({
            tradesmanEmail,
            tradesmanName,
            leadId,
            leadTitle,
            amountGbp,
            homeownerName,
            projectSummary,
            dashboardUrl,
          });
          console.log(
            "[stripe webhook] checkout.session.completed: confirmation email logged for:",
            tradesmanEmail,
          );
        } catch (emailError) {
          console.error(
            "[stripe webhook] Payment confirmation email failed (ignored):",
            emailError,
          );
        }
      } else {
        console.warn(
          "[stripe webhook] checkout.session.completed: missing customer email; skip confirmation email",
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
