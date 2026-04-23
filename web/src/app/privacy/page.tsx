import type { Metadata } from "next";

import { RenderMarkdown } from "@/components/legal/render-markdown";
import { HomeFooter } from "@/components/homepage/home-footer";
import { HomeHeader } from "@/components/homepage/home-header";
import { readPublicMarkdown } from "@/lib/read-public-markdown";

const siteUrl = "https://tradescore.uk";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "TradeScore Privacy Policy: what we collect (contact, trade type, project details, payments), GDPR rights, Stripe & MongoDB, cookies, retention, and how to contact us.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Privacy Policy | TradeScore",
    url: `${siteUrl}/privacy`,
    siteName: "TradeScore",
    type: "article",
  },
  alternates: {
    canonical: `${siteUrl}/privacy`,
  },
};

export default async function PrivacyPage() {
  const content = await readPublicMarkdown("privacy-policy.md");

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
              Privacy Policy
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Template <strong className="text-foreground">v1.0</strong> · Last
              updated <time dateTime="2026-04-23">23 April 2026</time>. See also{" "}
              <a
                href="/terms"
                className="font-medium text-[#FF6B35] underline underline-offset-2 hover:text-[#e85f2d]"
              >
                Terms of Service
              </a>
              .
            </p>
          </div>
        </div>

        <article className="mx-auto max-w-3xl px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
          <RenderMarkdown content={content} />
        </article>
      </main>
      <HomeFooter />
    </div>
  );
}
