import { createTRPCRouter } from "@/server/api/trpc";
import { adminRouter } from "@/server/api/routers/admin";
import { bidsRouter } from "@/server/api/routers/bids";
import { chatRouter } from "@/server/api/routers/chat";
import { leadsRouter } from "@/server/api/routers/leads";
import { paymentsRouter } from "@/server/api/routers/payments";
import { tradesmanRouter } from "@/server/api/routers/tradesman";

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  bids: bidsRouter,
  chat: chatRouter,
  leads: leadsRouter,
  payments: paymentsRouter,
  tradesman: tradesmanRouter,
});

export type AppRouter = typeof appRouter;
