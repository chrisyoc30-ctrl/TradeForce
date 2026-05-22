import type { Metadata } from "next";
import Link from "next/link";
import type React from "react";

import { HomeFooter } from "@/components/homepage/home-footer";
import { tradesSignupOrangeSolidCtaClasses } from "@/lib/cta-tailwind";
import { cn } from "@/lib/utils";

const siteUrl = "https://www.tradescore.uk/tradesperson";

export const metadata: Metadata = {
  title: "Get Verified Leads in Glasgow — TradeScore for Tradespeople",
  description:
    "One verified homeowner per job. No bidding wars. £25 per accepted lead or £99/month unlimited. First lead always free.",
  openGraph: {
    title: "Get Verified Leads in Glasgow — TradeScore for Tradespeople",
    description:
      "One verified homeowner per job. No bidding wars. First lead always free.",
    url: siteUrl,
    siteName: "TradeScore",
    locale: "en_GB",
    type: "website",
  },
  alternates: {
    canonical: siteUrl,
  },
};

const benefits = [
  {
    icon: "🎯",
    title: "Exclusive matching",
    body: "One verified homeowner per job. No competing against 5 other quotes.",
  },
  {
    icon: "💷",
    title: "Transparent pricing",
    body: "£25 per accepted lead, or £99/month unlimited. First lead always free.",
  },
  {
    icon: "📱",
    title: "SMS alerts",
    body: "Get a text the moment you're matched. Not buried in your inbox.",
  },
] as const;

const faqs = [
  {
    q: "How is this different from MyBuilder or Checkatrade?",
    a: "One trade per job. No bidding wars. We focus on quality matches, not volume of quotes sent to homeowners.",
  },
  {
    q: "When do I pay?",
    a: "Only when you accept a lead. You see the job details first and decide whether to pay. No charge if you decline.",
  },
  {
    q: "How are leads scored?",
    a: "Our matching system evaluates each homeowner submission for legitimacy and intent before matching to a tradesperson.",
  },
  {
    q: "What if I don't want a specific lead?",
    a: "Just don't accept it. No charge. We'll match the homeowner with another verified trade.",
  },
] as const;

function PricingList({ items }: { items: readonly React.ReactNode[] }) {
  return (
    <ul className="mb-6 space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2">
          <span className="text-orange-500" aria-hidden>
            ✓
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function TradespersonPage() {
  return (
    <div className="min-h-dvh bg-zinc-950 text-foreground">
      <main id="main-content">
        <section className="px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Tired of getting ghosted by potential clients?
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              You&apos;re not alone. We built TradeScore so Glasgow trades get
              verified homeowners — not bidding wars.
            </p>
            <Link
              href="/tradesman-signup"
              className={cn(tradesSignupOrangeSolidCtaClasses, "mt-8 inline-flex")}
            >
              Join Free as a Tradesperson
            </Link>
          </div>
        </section>

        <section
          className="border-y border-white/5 bg-muted/30 px-4 py-16"
          aria-labelledby="trade-why-heading"
        >
          <div className="mx-auto max-w-5xl">
            <h2 id="trade-why-heading" className="text-center text-3xl font-bold">
              Why TradeScore
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {benefits.map((item) => (
                <article key={item.title}>
                  <div className="text-3xl" aria-hidden>
                    {item.icon}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 text-muted-foreground">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="px-4 py-16"
          aria-labelledby="trade-pricing-heading"
        >
          <div className="mx-auto max-w-4xl">
            <h2
              id="trade-pricing-heading"
              className="text-center text-3xl font-bold"
            >
              Simple, fair pricing
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <article className="rounded-lg border border-border bg-card/40 p-8">
                <h3 className="text-2xl font-bold">Pay Per Lead</h3>
                <p className="mt-2 text-muted-foreground">
                  For trades who want flexibility
                </p>
                <PricingList
                  items={[
                    <>
                      <strong>First lead: FREE</strong>
                    </>,
                    "£25 per accepted lead after that",
                    "No subscription, no commitment",
                    "Only pay when you accept",
                  ]}
                />
              </article>
              <article className="relative rounded-lg border-2 border-orange-500 bg-card/40 p-8">
                <span className="absolute -top-3 right-4 rounded-full bg-orange-500 px-3 py-1 text-sm font-medium text-white">
                  Best Value
                </span>
                <h3 className="text-2xl font-bold">Unlimited</h3>
                <p className="mt-2 text-muted-foreground">
                  For trades doing 4+ jobs/month
                </p>
                <PricingList
                  items={[
                    <strong key="price">£99/month</strong>,
                    "Unlimited accepted leads",
                    "Cancel anytime",
                    "Priority matching when available",
                  ]}
                />
              </article>
            </div>
          </div>
        </section>

        <section
          className="border-y border-white/5 bg-muted/30 px-4 py-16"
          aria-labelledby="trade-faq-heading"
        >
          <div className="mx-auto max-w-3xl">
            <h2 id="trade-faq-heading" className="text-center text-3xl font-bold">
              Common questions
            </h2>
            <div className="mt-12 space-y-6">
              {faqs.map((item) => (
                <article key={item.q}>
                  <h3 className="text-lg font-semibold">{item.q}</h3>
                  <p className="mt-2 text-muted-foreground">{item.a}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold">
              Ready to stop getting ghosted?
            </h2>
            <Link
              href="/tradesman-signup"
              className={cn(tradesSignupOrangeSolidCtaClasses, "mt-6 inline-flex")}
            >
              Sign Up Free
            </Link>
          </div>
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}
