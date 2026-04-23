import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRADESMAN_LEAD_PRICE_GBP } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe-server";

export const paymentsRouter = createTRPCRouter({
  /**
   * Create a PaymentIntent for accepting a lead (£25 GBP).
   * Client confirms with Stripe.js (test card 4242 4242 4242 4242).
   * Webhook `payment_intent.succeeded` records payment on the lead in Mongo (via Flask).
   */
  createLeadAcceptanceIntent: publicProcedure
    .input(z.object({ leadId: z.string().min(1) }))
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

      const stripe = getStripe();
      const amountPence = TRADESMAN_LEAD_PRICE_GBP * 100;

      const intent = await stripe.paymentIntents.create({
        amount: amountPence,
        currency: "gbp",
        metadata: { leadId: input.leadId },
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
