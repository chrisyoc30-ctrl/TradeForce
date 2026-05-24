import type { Metadata } from "next";

import { HomeFooter } from "@/components/homepage/home-footer";
import { CustomerSegmentsSection } from "@/components/landing/customer-segments-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { TrustProfilesSection } from "@/components/landing/trust-profiles-section";
import { WhyTradeScoreSection } from "@/components/landing/why-tradescore-section";

const siteUrl = "https://www.tradescore.uk";

const metaDescription =
  "Get matched to one verified Glasgow tradesperson — Companies House, Gas Safe, and insurance verified. No bidding wars. Post your job free. Verified trade reaches out within 24 hours.";

export const metadata: Metadata = {
  title: {
    absolute:
      "TradeScore — Glasgow's Verified Trade Platform | One Job, One Verified Trade",
  },
  description: metaDescription,
  openGraph: {
    title: "TradeScore — Glasgow's Verified Trade Platform",
    description: metaDescription,
    url: siteUrl,
    siteName: "TradeScore",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "/tradescore-logo.png",
        width: 440,
        height: 120,
        alt: "TradeScore — Glasgow's Verified Trade Platform",
      },
    ],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950 text-foreground">
      <main id="main-content" className="flex flex-1 flex-col">
        <HeroSection />
        <HowItWorksSection />
        <CustomerSegmentsSection />
        <WhyTradeScoreSection />
        <PricingSection />
        <TrustProfilesSection />
        <FinalCtaSection />
      </main>
      <HomeFooter />
    </div>
  );
}
