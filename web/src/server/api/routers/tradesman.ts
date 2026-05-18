import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { getApiBaseUrl } from "@/lib/api-url";
import type { Lead } from "@/types/lead";

export type TradespersonLeadsFeed = {
  exclusive_matches: Lead[];
  eligible_open_leads: Lead[];
};

export const tradesmanRouter = createTRPCRouter({
  /** Open leads for trades — same feed as the lead scoring board. */
  // Same backend as `leads.getUnmatched`; both UIs are active. See note on `leads.getUnmatched`.
  getMatchedProjects: publicProcedure.query(async () => {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/api/leads/unmatched`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(
        `tradesman.getMatchedProjects: ${res.status} ${t || res.statusText}`
      );
    }
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) {
      return [] as Lead[];
    }
    return data as Lead[];
  }),

  /** Exclusive matches + trade-filtered open board for /available-jobs. */
  getMyLeads: publicProcedure
    .input(z.object({ tradespersonId: z.string().min(1) }))
    .query(async ({ input }) => {
      const base = getApiBaseUrl();
      const res = await fetch(
        `${base}/api/tradesperson/${encodeURIComponent(input.tradespersonId.trim())}/leads`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        const t = await res.text();
        throw new Error(
          `tradesman.getMyLeads: ${res.status} ${t || res.statusText}`,
        );
      }
      const data = (await res.json()) as TradespersonLeadsFeed;
      return {
        exclusive_matches: Array.isArray(data.exclusive_matches)
          ? data.exclusive_matches
          : [],
        eligible_open_leads: Array.isArray(data.eligible_open_leads)
          ? data.eligible_open_leads
          : [],
      };
    }),
});
