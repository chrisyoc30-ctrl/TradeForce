import type { Metadata } from "next";

import { FinalCta } from "@/components/homepage/final-cta";
import { HomeFooter } from "@/components/homepage/home-footer";
import { HomeHero } from "@/components/homepage/hero";
import { HowItWorks } from "@/components/homepage/how-it-works";
import { PricingPreview } from "@/components/homepage/pricing-preview";
import { HomeStructuredData } from "@/components/homepage/structured-data";
import { ValuePropositions } from "@/components/homepage/value-propositions";

const siteUrl = "https://tradescore.uk";

export const metadata: Metadata = {
  title: {
    absolute: "TradeScore | Stop Competing With 10 Other Glasgow Trades",
  },
  description:
    "TradeScore connects Glasgow homeowners with verified local tradespeople. Post a job free — trades pay £25 per lead, no commission.",
  keywords: [
    "Glasgow trades",
    "lead matching",
    "homeowners",
    "verified tradesmen",
    "AI leads",
    "TradeScore",
  ],
  openGraph: {
    title: "TradeScore | AI Lead Matching for Glasgow",
    description:
      "Quality projects. Transparent pricing. Stop competing with ten other trades for the same job.",
    url: siteUrl,
    siteName: "TradeScore",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeScore | Glasgow trades & homeowners",
    description:
      "AI-powered matching. Free for homeowners. £25 per lead for trades — first lead free.",
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function HomePage() {
  return (
    <>
      <HomeStructuredData />
      <div className="min-h-dvh bg-zinc-950 text-foreground">
        <main id="main-content">
          <HomeHero />
          <ValuePropositions />
          <HowItWorks />
          <PricingPreview />
          <FinalCta />
        </main>
        <HomeFooter />
      </div>
    </>
  );
}
