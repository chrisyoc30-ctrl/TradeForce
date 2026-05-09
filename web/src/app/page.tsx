import type { Metadata } from "next";

import { FinalCta } from "@/components/homepage/final-cta";
import { HomeFooter } from "@/components/homepage/home-footer";
import { HomeHero } from "@/components/homepage/hero";
import { HowItWorks } from "@/components/homepage/how-it-works";
import { HowWeVerifySection } from "@/components/homepage/how-we-verify-section";
import { PricingPreview } from "@/components/homepage/pricing-preview";
import { HomeStructuredData } from "@/components/homepage/structured-data";
import { ValuePropositions } from "@/components/homepage/value-propositions";

const siteUrl = "https://tradescore.uk";

export const metadata: Metadata = {
  title: {
    absolute:
      "TradeScore — Verified Glasgow Tradespeople | One Job, One Matched Trade",
  },
  description:
    "Post free: get matched to ONE Glasgow tradesperson. Companies House checks plus optional ID & insurance review. Your details stay private until the match accepts.",
  keywords: [
    "Glasgow trades",
    "lead matching",
    "homeowners",
    "verified tradesmen",
    "AI leads",
    "TradeScore",
  ],
  openGraph: {
    title: "TradeScore — Verified Glasgow trades | One matched trade per job",
    description:
      "Companies House checks, optional ID & insurance review, exclusive matching. Free job posts for homeowners.",
    url: siteUrl,
    siteName: "TradeScore",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeScore — verified Glasgow tradespeople",
    description:
      "One job, one matched trade. Checks + privacy-first matching — free for homeowners.",
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
          <HowWeVerifySection />
          <PricingPreview />
          <FinalCta />
        </main>
        <HomeFooter />
      </div>
    </>
  );
}
