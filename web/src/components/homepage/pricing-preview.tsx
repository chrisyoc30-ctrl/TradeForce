import Link from "next/link";

import { PricingCard } from "@/components/pricing/pricing-card";
import { HomepageSection } from "@/components/homepage/section";
import { buttonVariants } from "@/components/ui/button";
import { pricingCopy } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function PricingPreview() {
  return (
    <HomepageSection
      id="pricing"
      eyebrow="Pricing"
      title={pricingCopy.brandLine}
      description="No hidden tiers. No surprise commissions. Just a fair model that rewards quality work."
    >
      <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
        <PricingCard
          title={pricingCopy.homeowners.title}
          priceLabel={pricingCopy.homeowners.priceLabel}
          summary="Always FREE — post your project with confidence."
          points={[
            "Find verified trades without listing fees",
            "Transparent quotes — you stay in control",
            ...pricingCopy.homeowners.points,
          ]}
          className="border-white/10 bg-zinc-900/40"
        />
        <PricingCard
          title={pricingCopy.trades.title}
          priceLabel={pricingCopy.trades.priceLabel}
          summary="£25 per lead — first lead FREE. No commission."
          points={pricingCopy.trades.points}
          emphasize
          className="border-white/10 bg-zinc-900/40"
        />
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          href="/pricing"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "border-[#FF6B35]/40 text-[#FF6B35] hover:bg-[#FF6B35]/10"
          )}
        >
          Full pricing details
        </Link>
      </div>
    </HomepageSection>
  );
}
