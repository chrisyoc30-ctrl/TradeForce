import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

import { HomeFooter } from "@/components/homepage/home-footer";
import { Brandmark } from "@/components/ui/brandmark";
import {
  postJobOrangeSolidCtaClasses,
  tradesSignupHeroOutlineCtaClasses,
} from "@/lib/cta-tailwind";
import { cn } from "@/lib/utils";

const siteUrl = "https://www.tradescore.uk";

export const metadata: Metadata = {
  title: {
    absolute: "TradeScore — Glasgow's Verified Trade Platform",
  },
  description:
    "Glasgow's verified trade platform. One job. One verified trade. No bidding wars. Post your job free or sign up as a tradesperson.",
  openGraph: {
    title: "TradeScore — Glasgow's Verified Trade Platform",
    description:
      "Glasgow's verified trade platform. One job. One verified trade. No bidding wars.",
    url: siteUrl,
    siteName: "TradeScore",
    locale: "en_GB",
    type: "website",
  },
  alternates: {
    canonical: siteUrl,
  },
};

const trustItems = [
  "Companies House Verified",
  "Gas Safe Engineers",
  "Insured Trades",
] as const;

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950 text-foreground">
      <main
        id="main-content"
        className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:py-20"
      >
        <div className="mx-auto w-full max-w-4xl text-center">
          <Brandmark size="lg" asLink={false} className="mx-auto" />

          <h1 className="mt-8 text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Glasgow&apos;s verified trade platform.
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
            One job. One verified trade. No bidding wars.
          </p>

          <ul
            className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-x-4 gap-y-3 text-sm text-muted-foreground sm:gap-x-8"
            aria-label="Trust indicators"
          >
            {trustItems.map((label) => (
              <li key={label} className="flex items-center gap-2">
                <CheckCircle
                  className="size-4 shrink-0 text-emerald-400"
                  aria-hidden
                />
                <span>{label}</span>
              </li>
            ))}
          </ul>

          <div className="mx-auto mt-12 flex max-w-2xl flex-col gap-4 md:flex-row">
            <Link
              href="/homeowner"
              className={cn(
                postJobOrangeSolidCtaClasses,
                "flex min-h-[88px] flex-1 flex-col items-center justify-center px-8 py-6 text-center"
              )}
            >
              <span className="text-lg font-semibold">I need a tradesperson</span>
              <span className="mt-1 text-sm font-normal opacity-90">
                Post a job free
              </span>
            </Link>

            <Link
              href="/tradesperson"
              className={cn(
                tradesSignupHeroOutlineCtaClasses,
                "flex min-h-[88px] flex-1 flex-col items-center justify-center px-8 py-6 text-center"
              )}
            >
              <span className="text-lg font-semibold">I am a tradesperson</span>
              <span className="mt-1 text-sm font-normal opacity-90">
                Get verified leads
              </span>
            </Link>
          </div>
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}
