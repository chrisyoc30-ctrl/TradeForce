import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PricingCard } from "@/components/pricing/pricing-card";
import { pricingCopy } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Trades — get started | TradeScore",
  description:
    "£25 per lead after your first free lead. No commission, no monthly subscription.",
};

export default function TradesmanSignupPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-10 px-6 py-16">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          Trades — get started
        </h1>
        <p className="text-muted-foreground">
          Browse AI-scored leads and quote jobs that fit your business.{" "}
          <span className="font-medium text-foreground/90">
            {pricingCopy.trades.headline}
          </span>
        </p>
      </header>

      <PricingCard
        title={pricingCopy.trades.title}
        priceLabel={pricingCopy.trades.priceLabel}
        summary="£25 per lead — flat fee, no commission"
        points={pricingCopy.trades.points}
        emphasize
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href="/lead-scoring"
          className={cn(buttonVariants({ size: "lg" }), "inline-flex justify-center")}
        >
          View available leads
        </Link>
        <Link
          href="/pricing"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "inline-flex justify-center"
          )}
        >
          Full pricing
        </Link>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "lg" }),
            "inline-flex justify-center"
          )}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
