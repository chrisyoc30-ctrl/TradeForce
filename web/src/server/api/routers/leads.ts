import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { getApiBaseUrl } from "@/lib/api-url";
import { checkRateLimit } from "@/lib/rate-limit";
import type { CreateLeadResult, Lead, MatchedTradesman } from "@/types/lead";

function parseNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
}

function asStringArrayFromJson(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: string[] = [];
  for (const item of value) {
    if (typeof item === "string" && item.trim()) {
      out.push(item.trim());
    }
  }
  return out;
}

function normalizeCreateLeadResult(raw: Record<string, unknown>): CreateLeadResult {
  const id = String(
    raw["id"] ?? raw["lead_id"] ?? raw["leadId"] ?? ""
  ).trim();
  const aiScore = parseNumber(raw["ai_score"] ?? raw["aiScore"], 0);
  const aiGrade = String(
    raw["ai_grade"] ?? raw["aiGrade"] ?? "B"
  ).trim() || "B";
  const fraud = raw["fraudRisk"];
  const fraudRisk =
    typeof fraud === "string" && (fraud === "low" || fraud === "medium" || fraud === "high")
      ? fraud
      : "low";
  const parsedFlags = asStringArrayFromJson(raw["ai_flags"]);
  return {
    id,
    success: typeof raw["success"] === "boolean" ? raw["success"] : true,
    lead_id: String(raw["lead_id"] ?? raw["id"] ?? ""),
    ai_grade: String(raw["ai_grade"] ?? aiGrade),
    ai_score: aiScore,
    ai_summary: typeof raw["ai_summary"] === "string" ? raw["ai_summary"] : undefined,
    ai_reason: typeof raw["ai_reason"] === "string" ? raw["ai_reason"] : undefined,
    ai_estimated_value:
      typeof raw["ai_estimated_value"] === "string"
        ? raw["ai_estimated_value"]
        : undefined,
    ai_flags: parsedFlags.length ? parsedFlags : undefined,
    ai_scored_by_ai: typeof raw["ai_scored_by_ai"] === "boolean" ? raw["ai_scored_by_ai"] : undefined,
    ai_model_used:
      typeof raw["ai_model_used"] === "string" ? raw["ai_model_used"] : undefined,
    aiScore,
    aiGrade,
    fraudRisk,
    scoreBreakdown:
      raw["scoreBreakdown"] &&
      typeof raw["scoreBreakdown"] === "object" &&
      raw["scoreBreakdown"] !== null
        ? (raw["scoreBreakdown"] as CreateLeadResult["scoreBreakdown"])
        : undefined,
    aiSummary: typeof raw["ai_summary"] === "string" ? raw["ai_summary"] : undefined,
    aiReason: typeof raw["ai_reason"] === "string" ? raw["ai_reason"] : undefined,
    aiEstimatedValue:
      typeof raw["ai_estimated_value"] === "string"
        ? raw["ai_estimated_value"]
        : undefined,
    aiFlags: parsedFlags.length ? parsedFlags : undefined,
    aiScoredByAI:
      typeof raw["ai_scored_by_ai"] === "boolean"
        ? raw["ai_scored_by_ai"]
        : true,
  };
}

/** Shared fetch for open leads (lead scoring board + router alias). */
async function fetchUnmatchedLeadsFromApi(): Promise<Lead[]> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/leads/unmatched`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`leads: ${res.status} ${t || res.statusText}`);
  }
  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    return [];
  }
  return data as Lead[];
}

const createLeadInput = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().optional(),
  postcode: z.string().min(1),
  projectType: z.string().optional(),
  description: z.string().optional(),
  budget: z.union([z.number(), z.string()]).optional(),
  timeline: z.string().optional(),
});

function trpcErrorFromHttpStatus(status: number, bodyText: string): TRPCError {
  let message = bodyText.trim() || "";
  try {
    const j = JSON.parse(bodyText) as { error?: unknown };
    if (typeof j?.error === "string" && j.error.trim()) {
      message = j.error.trim();
    }
  } catch {
    /* use raw body */
  }
  if (!message) {
    message = `Request failed (${status})`;
  }
  const code =
    status === 404
      ? "NOT_FOUND"
      : status === 401 || status === 403
        ? "FORBIDDEN"
        : status >= 500
          ? "INTERNAL_SERVER_ERROR"
          : "BAD_REQUEST";
  return new TRPCError({ code, message });
}

export const leadsRouter = createTRPCRouter({
  getUnmatched: publicProcedure.query(async () => {
    return fetchUnmatchedLeadsFromApi();
  }),

  getAll: publicProcedure.query(async () => {
    return fetchUnmatchedLeadsFromApi();
  }),

  create: publicProcedure
    .input(createLeadInput)
    .mutation(async ({ input }) => {
      const base = getApiBaseUrl();
      let res: globalThis.Response;
      try {
        res = await fetch(`${base}/api/leads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: input.name,
            phone: input.phone,
            email: input.email,
            postcode: input.postcode,
            location: input.postcode,
            projectType: input.projectType,
            service: input.projectType,
            description: input.description,
            budget: input.budget,
            timeline: input.timeline,
          }),
        });
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Could not reach the API at ${base}. Set API_URL or NEXT_PUBLIC_API_URL to your Flask service URL.`,
          cause: e,
        });
      }
      if (!res.ok) {
        const t = await res.text();
        throw trpcErrorFromHttpStatus(res.status, t);
      }
      const raw = (await res.json()) as Record<string, unknown>;
      const data: CreateLeadResult = normalizeCreateLeadResult(raw);
      if (input.email?.trim()) {
        try {
          await fetch(`${base}/api/email/lead-received`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: input.email.trim(),
              name: input.name,
              projectType: input.projectType,
              leadId: data.id,
            }),
          });
        } catch {
          /* optional email */
        }
      }
      return data;
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
    .query(async ({ input, ctx }) => {
      const rl = checkRateLimit(
        `homeowner-dashboard:${ctx.clientIp}`,
        5
      );
      if (!rl.ok) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many lookups. Try again in about ${Math.max(1, Math.ceil(rl.retryAfterMs / 60000))} minute(s).`,
        });
      }
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
