import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Subscription activated | TradeScore",
  description: "Your TradeScore Unlimited subscription is being finalized",
};

export default async function SubscriptionSuccessPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-foreground">
      <h1 className="text-2xl font-semibold tracking-tight">
        Checkout complete
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Thanks — Stripe is processing your Unlimited subscription. It can take up to a minute for
        your account to flip to Unlimited; refresh the Subscription page shortly. If billing
        does not activate, confirm your tradesperson ID was passed as Stripe{" "}
        <code className="rounded bg-muted px-1">client_reference_id</code>.
      </p>
      <Link
        href="/subscription"
        className={cn(buttonVariants(), "mt-8 inline-flex bg-amber-500 text-slate-950 hover:bg-amber-400")}
      >
        Open subscription
      </Link>
    </div>
  );
}
