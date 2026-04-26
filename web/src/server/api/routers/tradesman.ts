import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { getApiBaseUrl } from "@/lib/api-url";
import type { Lead } from "@/types/lead";

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
});
