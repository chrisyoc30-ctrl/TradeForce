import { initTRPC } from "@trpc/server";

export const createTRPCContext = async () => ({});

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
