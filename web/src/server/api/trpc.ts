import { initTRPC } from "@trpc/server";
import { headers } from "next/headers";

export const createTRPCContext = async () => {
  try {
    const h = await headers();
    const raw =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      "unknown";
    return { clientIp: raw };
  } catch {
    return { clientIp: "unknown" };
  }
};

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
