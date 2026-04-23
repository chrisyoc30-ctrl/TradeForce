import type { Metadata } from "next";

import { RenderMarkdown } from "@/components/legal/render-markdown";
import { HomeFooter } from "@/components/homepage/home-footer";
import { HomeHeader } from "@/components/homepage/home-header";
import { readPublicMarkdown } from "@/lib/read-public-markdown";

const siteUrl = "https://tradescore.uk";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "TradeScore Terms of Service: platform rules, lead fees (£25 per accepted lead for trades, first lead may be free), refunds, disputes, and liability.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Terms of Service | TradeScore",
    description:
      "Legal terms for using TradeScore — homeowners, tradespeople, payments, and dispute resolution.",
    url: `${siteUrl}/terms`,
    siteName: "TradeScore",
    type: "article",
  },
  alternates: {
    canonical: `${siteUrl}/terms`,
  },
};

export default async function TermsPage() {
  const content = await readPublicMarkdown("terms-of-service.md");

  return (
    <div className="min-h-dvh bg-zinc-950 text-foreground">
      <HomeHeader />
      <main id="main-content" className="pb-16">
        <div className="border-b border-white/5 bg-gradient-to-b from-zinc-900/80 to-zinc-950 px-4 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF6B35]">
              Legal
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Terms of Service
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Version <strong className="text-foreground">1.0</strong> · Last
              updated{" "}
              <time dateTime="2026-04-23">23 April 2026</time>
              . Related:{" "}
              <a
                href="/privacy"
                className="font-medium text-[#FF6B35] underline underline-offset-2 hover:text-[#e85f2d]"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>

        <article
          className="mx-auto max-w-3xl px-4 pb-12 pt-8 sm:px-6 sm:pt-10"
          aria-labelledby="terms-title"
        >
          <h2 id="terms-title" className="sr-only">
            Full terms of service
          </h2>
          <RenderMarkdown content={content} />
        </article>

        <aside className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Questions?</p>
            <p className="mt-2">
              Email{" "}
              <a
                href="mailto:hello@tradescore.uk"
                className="font-medium text-[#FF6B35] underline underline-offset-2"
              >
                hello@tradescore.uk
              </a>{" "}
              for clarifications. This document is a template — have it reviewed
              by a lawyer before launch.
            </p>
          </div>
        </aside>
      </main>
      <HomeFooter />
    </div>
  );
}
