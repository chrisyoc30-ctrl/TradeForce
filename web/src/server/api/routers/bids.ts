import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { getApiBaseUrl } from "@/lib/api-url";
import type { Bid } from "@/types/lead";

async function readJsonOrThrow(res: globalThis.Response, label: string) {
  if (!res.ok) {
    const t = await res.text();
    throw new TRPCError({
      code: res.status === 404 ? "NOT_FOUND" : "BAD_REQUEST",
      message: `${label}: ${res.status} ${t || res.statusText}`,
    });
  }
  return res.json() as Promise<unknown>;
}

export const bidsRouter = createTRPCRouter({
  getForLead: publicProcedure
    .input(z.object({ leadId: z.string().min(1) }))
    .query(async ({ input }) => {
      const base = getApiBaseUrl();
      const res = await fetch(
        `${base}/api/leads/${encodeURIComponent(input.leadId)}/bids`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`bids.getForLead: ${res.status} ${t || res.statusText}`);
      }
      const data = (await res.json()) as unknown;
      if (!Array.isArray(data)) return [] as Bid[];
      return data as Bid[];
    }),

  submit: publicProcedure
    .input(
      z.object({
        leadId: z.string().min(1),
        amount: z.number(),
        description: z.string().min(1),
        tradesmanId: z.string().min(1),
        tradesmanName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const base = getApiBaseUrl();
      const res = await fetch(
        `${base}/api/leads/${encodeURIComponent(input.leadId)}/bids`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: input.leadId,
            amount: input.amount,
            description: input.description,
            tradesmanId: input.tradesmanId,
            tradesmanName: input.tradesmanName,
          }),
        }
      );
      return readJsonOrThrow(res, "bids.submit") as Promise<Bid>;
    }),

  accept: publicProcedure
    .input(z.object({ bidId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const base = getApiBaseUrl();
      const res = await fetch(
        `${base}/api/bids/${encodeURIComponent(input.bidId)}/accept`,
        { method: "POST" }
      );
      return readJsonOrThrow(res, "bids.accept") as Promise<Bid>;
    }),
});
