import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PricingCard } from "@/components/pricing/pricing-card";
import { pricingCopy } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Pricing | TradeScore",
  description:
    "Homeowners post for free. Trades pay £25 per lead after one free lead — no commission.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
        <p className="text-muted-foreground">{pricingCopy.brandLine}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <PricingCard
          title={pricingCopy.homeowners.title}
          priceLabel={pricingCopy.homeowners.priceLabel}
          summary={pricingCopy.homeowners.summary}
          points={pricingCopy.homeowners.points}
        />
        <PricingCard
          title={pricingCopy.trades.title}
          priceLabel={pricingCopy.trades.priceLabel}
          summary={pricingCopy.trades.summary}
          points={pricingCopy.trades.points}
          emphasize
        />
      </div>

      <div className="rounded-xl border border-border/80 bg-muted/15 p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Consistent policy</p>
        <ul className="mt-3 list-inside list-disc space-y-2">
          <li>
            <strong className="text-foreground">Homeowners:</strong> always
            FREE — no charge to submit a project.
          </li>
          <li>
            <strong className="text-foreground">Tradespeople:</strong> your
            first lead is FREE; after that, £25 per lead when you accept a lead.
            That £25 is a flat fee — not a percentage of the job (no commission).
          </li>
          <li>No monthly subscription — you only pay when you accept a lead.</li>
          <li>
            No commission on work you do — you keep 100% of what the homeowner
            pays you for the job.
          </li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/lead-capture" className={cn(buttonVariants({ size: "lg" }))}>
          Post a job (free)
        </Link>
        <Link
          href="/tradesman-signup"
          className={cn(
            buttonVariants({ variant: "secondary", size: "lg" })
          )}
        >
          Join as a trade
        </Link>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          Home
        </Link>
      </div>
    </div>
  );
}
