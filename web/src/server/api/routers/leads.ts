import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { getApiBaseUrl } from "@/lib/api-url";
import type { CreateLeadResult, Lead, MatchedTradesman } from "@/types/lead";

const createLeadInput = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().optional(),
  projectType: z.string().optional(),
  description: z.string().optional(),
  budget: z.union([z.number(), z.string()]).optional(),
  timeline: z.string().optional(),
  projectComplexity: z.enum(["simple", "medium", "complex"]).optional(),
  estimatedQuoteMin: z.number().optional(),
  estimatedQuoteMax: z.number().optional(),
});

async function readJsonOrThrow(res: globalThis.Response, label: string) {
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${label}: ${res.status} ${t || res.statusText}`);
  }
  return res.json() as Promise<unknown>;
}

export const leadsRouter = createTRPCRouter({
  getUnmatched: publicProcedure.query(async () => {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/api/leads/unmatched`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`leads.getUnmatched: ${res.status} ${t || res.statusText}`);
    }
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) {
      return [] as Lead[];
    }
    return data as Lead[];
  }),

  create: publicProcedure
    .input(createLeadInput)
    .mutation(async ({ input }) => {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: input.name,
          phone: input.phone,
          email: input.email,
          projectType: input.projectType,
          service: input.projectType,
          description: input.description,
          budget: input.budget,
          timeline: input.timeline,
          projectComplexity: input.projectComplexity,
          estimatedQuoteMin: input.estimatedQuoteMin,
          estimatedQuoteMax: input.estimatedQuoteMax,
        }),
      });
      return readJsonOrThrow(res, "leads.create") as Promise<CreateLeadResult>;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const base = getApiBaseUrl();
      const res = await fetch(
        `${base}/api/leads/${encodeURIComponent(input.id)}`,
        { cache: "no-store" }
      );
      if (res.status === 404) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      }
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`leads.getById: ${res.status} ${t || res.statusText}`);
      }
      return res.json() as Promise<Lead>;
    }),

  getMatched: publicProcedure
    .input(z.object({ leadId: z.string().min(1) }))
    .query(async ({ input }) => {
      const base = getApiBaseUrl();
      const res = await fetch(
        `${base}/api/leads/${encodeURIComponent(input.leadId)}/matched`,
        { cache: "no-store" }
      );
      if (res.status === 404) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      }
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`leads.getMatched: ${res.status} ${t || res.statusText}`);
      }
      const data = (await res.json()) as unknown;
      if (!Array.isArray(data)) return [] as MatchedTradesman[];
      return data as MatchedTradesman[];
    }),

  getUserLeads: publicProcedure
    .input(z.object({ phone: z.string().min(8) }))
    .query(async ({ input }) => {
      const base = getApiBaseUrl();
      const url = `${base}/api/leads/for-user?phone=${encodeURIComponent(input.phone)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`leads.getUserLeads: ${res.status} ${t || res.statusText}`);
      }
      const data = (await res.json()) as unknown;
      if (!Array.isArray(data)) return [] as Lead[];
      return data as Lead[];
    }),
});
