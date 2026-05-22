import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

import { HomeFooter } from "@/components/homepage/home-footer";
import { postJobOrangeSolidCtaClasses } from "@/lib/cta-tailwind";
import { cn } from "@/lib/utils";

const siteUrl = "https://www.tradescore.uk/homeowner";

export const metadata: Metadata = {
  title: "Post a Job Free — TradeScore Glasgow",
  description:
    "Get matched with one verified Glasgow tradesperson. Free to post, no spam, no bidding wars. Every trade verified through Companies House and insurance checks.",
  openGraph: {
    title: "Post a Job Free — TradeScore Glasgow",
    description:
      "Get matched with one verified Glasgow tradesperson. Free to post, no spam, no bidding wars.",
    url: siteUrl,
    siteName: "TradeScore",
    locale: "en_GB",
    type: "website",
  },
  alternates: {
    canonical: siteUrl,
  },
};

const steps = [
  {
    title: "Post your job",
    body: "Tell us what you need done. Free, no signup required.",
  },
  {
    title: "We match you",
    body: "Our matching system pairs you with one verified trade with relevant experience in your area.",
  },
  {
    title: "They contact you",
    body: "Your matched tradesperson reaches out within hours, not days.",
  },
] as const;

const trustBullets = [
  "Companies House registration (where applicable)",
  "Gas Safe Register (for gas engineers)",
  "Public Liability Insurance (£2m minimum)",
  "ID verification by our team",
  "Founder review before joining the platform",
] as const;

const faqs = [
  {
    q: "Is it really free?",
    a: "Yes, completely. We charge tradespeople, never homeowners.",
  },
  {
    q: "How quickly will I be contacted?",
    a: "Most matches happen within 60 seconds. Trade contact typically within 4-24 hours.",
  },
  {
    q: "What if the trade isn't right?",
    a: "Every trade is verified before joining. If you're not happy, contact us — we'll re-match you with a different tradesperson.",
  },
  {
    q: "Can I see who's matched to me?",
    a: "Yes, you receive an email with full trade details, verification badges, and bio when matched.",
  },
] as const;

export default function HomeownerPage() {
  return (
    <div className="min-h-dvh bg-zinc-950 text-foreground">
      <main id="main-content">
        <section className="px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              One verified Glasgow tradesperson for your job.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Free to post. No spam. No bidding wars.
            </p>
            <Link
              href="/post-a-job"
              className={cn(postJobOrangeSolidCtaClasses, "mt-8 inline-flex")}
            >
              Post Your Job — Takes 2 Minutes
            </Link>
          </div>
        </section>

        <section
          className="border-y border-white/5 bg-muted/30 px-4 py-16"
          aria-labelledby="homeowner-how-heading"
        >
          <div className="mx-auto max-w-5xl">
            <h2
              id="homeowner-how-heading"
              className="text-center text-3xl font-bold"
            >
              How it works
            </h2>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title} className="text-center">
                  <div
                    className="text-3xl font-bold text-orange-500"
                    aria-hidden
                  >
                    {index + 1}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          className="px-4 py-16"
          aria-labelledby="homeowner-trust-heading"
        >
          <div className="mx-auto max-w-3xl">
            <h2
              id="homeowner-trust-heading"
              className="text-center text-3xl font-bold"
            >
              Every TradeScore tradesperson is verified
            </h2>
            <ul className="mt-8 space-y-3 text-lg">
              {trustBullets.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle
                    className="mt-1 size-5 shrink-0 text-emerald-400"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className="border-y border-white/5 bg-muted/30 px-4 py-16"
          aria-labelledby="homeowner-faq-heading"
        >
          <div className="mx-auto max-w-3xl">
            <h2
              id="homeowner-faq-heading"
              className="text-center text-3xl font-bold"
            >
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
              Ready to find your verified tradesperson?
            </h2>
            <Link
              href="/post-a-job"
              className={cn(postJobOrangeSolidCtaClasses, "mt-6 inline-flex")}
            >
              Post Your Job Now
            </Link>
          </div>
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}
