import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  descriptionExcerpt,
  projectTypeLabel,
} from "@/components/leads/lead-helpers";
import { getApiBaseUrl } from "@/lib/api-url";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRADESMAN_LEAD_PRICE_GBP } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe-server";
import type { Lead } from "@/types/lead";

const STRIPE_METADATA_MAX = 500;

function clipMeta(s: string): string {
  return s.length > STRIPE_METADATA_MAX
    ? s.slice(0, STRIPE_METADATA_MAX - 1) + "…"
    : s;
}

export const paymentsRouter = createTRPCRouter({
  /**
   * Create a PaymentIntent for accepting a lead (£25 GBP).
   * Client confirms with Stripe.js (test card 4242 4242 4242 4242).
   * Webhook `payment_intent.succeeded` records payment on the lead in Mongo (via Flask).
   */
  createLeadAcceptanceIntent: publicProcedure
    .input(
      z.object({
        leadId: z.string().min(1),
        tradesmanEmail: z.string().email(),
        tradesmanName: z.string().min(1).max(200),
      }),
    )
    .mutation(async ({ input }) => {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Stripe is not configured (missing STRIPE_SECRET_KEY). Add test keys to .env.local.",
        });
      }
      const publishableKey =
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
      if (!publishableKey) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY for client-side confirmation.",
        });
      }

      const base = getApiBaseUrl();
      const res = await fetch(
        `${base}/api/leads/${encodeURIComponent(input.leadId)}`,
        { cache: "no-store" },
      );
      if (res.status === 404) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      }
      if (!res.ok) {
        const t = await res.text();
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: `Could not load lead: ${res.status} ${t || res.statusText}`,
        });
      }
      const lead = (await res.json()) as Lead;

      const leadTitle = clipMeta(projectTypeLabel(lead));
      const homeownerName = clipMeta(
        (lead.name && lead.name.trim()) || "Your client",
      );
      const projectSummary = clipMeta(descriptionExcerpt(lead, 200));

      const stripe = getStripe();
      const amountPence = TRADESMAN_LEAD_PRICE_GBP * 100;

      const intent = await stripe.paymentIntents.create({
        amount: amountPence,
        currency: "gbp",
        metadata: {
          leadId: input.leadId,
          tradesmanEmail: input.tradesmanEmail.trim().toLowerCase(),
          tradesmanName: clipMeta(input.tradesmanName.trim()),
          leadTitle,
          homeownerName,
          homeownerEmail: lead.email
            ? clipMeta(String(lead.email).trim().toLowerCase())
            : "",
          projectSummary,
        },
        description: `Lead acceptance — ${leadTitle} (${input.leadId})`,
        automatic_payment_methods: { enabled: true },
      });

      if (!intent.client_secret) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Stripe did not return a client secret",
        });
      }

      return {
        clientSecret: intent.client_secret,
        publishableKey,
        amountPence,
        currency: "gbp" as const,
      };
    }),
});
