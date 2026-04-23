import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { getApiBaseUrl } from "@/lib/api-url";
import type { AdminMetrics } from "@/types/lead";

export const adminRouter = createTRPCRouter({
  getMetrics: publicProcedure
    .input(z.object({ adminSecret: z.string().optional() }))
    .query(async ({ input }) => {
      const base = getApiBaseUrl();
      const secret = input.adminSecret ?? "";
      const headers: Record<string, string> = {};
      if (secret) headers["X-Admin-Secret"] = secret;

      const res = await fetch(`${base}/api/admin/metrics`, {
        cache: "no-store",
        headers,
      });
      if (res.status === 401) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message:
            "Admin secret required. Set ADMIN_SECRET on the Flask API and pass the same value here.",
        });
      }
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`admin.getMetrics: ${res.status} ${t || res.statusText}`);
      }
      return res.json() as Promise<AdminMetrics>;
    }),
});
