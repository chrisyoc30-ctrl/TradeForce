import type { Metadata } from "next";

import { FaqJsonLd } from "@/components/faq/faq-json-ld";
import { FaqPageClient } from "@/components/faq/faq-page-client";
import { HomeFooter } from "@/components/homepage/home-footer";
import { HomeHeader } from "@/components/homepage/home-header";

const siteUrl = "https://tradescore.uk";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about TradeScore — how lead matching works, costs, verification, and payments.",
  keywords: [
    "TradeScore FAQ",
    "Glasgow trades",
    "lead pricing",
    "homeowners",
    "verified trades",
  ],
  openGraph: {
    title: "TradeScore | FAQ",
    description:
      "Answers for homeowners and trades: costs, verification, payments, and how AI matching works.",
    url: `${siteUrl}/faq`,
    siteName: "TradeScore",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "TradeScore FAQ",
    description: "Help for homeowners and trades — pricing, matching, payments.",
  },
  alternates: {
    canonical: `${siteUrl}/faq`,
  },
};

export default async function FaqPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const defaultTab = sp.tab === "trades" ? "tradesmen" : "homeowners";
  return (
    <>
      <FaqJsonLd />
      <div className="min-h-dvh bg-zinc-950 text-foreground">
        <HomeHeader />
        <main id="main-content">
          <header className="border-b border-white/5 bg-gradient-to-b from-zinc-900/80 to-zinc-950 px-4 py-14 sm:px-6 sm:py-16">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF6B35]">
                Help centre
              </p>
              <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Frequently asked questions
              </h1>
              <p className="mt-4 text-pretty text-muted-foreground sm:text-lg">
                Straight answers for homeowners and trades — costs, matching, and
                what happens next.
              </p>
            </div>
          </header>
          <FaqPageClient defaultTab={defaultTab} />
        </main>
        <HomeFooter />
      </div>
    </>
  );
}
