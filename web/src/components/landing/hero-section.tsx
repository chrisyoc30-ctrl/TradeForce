import Link from "next/link";

import { TrustBadgePill } from "@/components/landing/trust-badge-pill";
import {
  postJobOrangeSolidCtaClasses,
  tradesSignupHeroOutlineCtaClasses,
} from "@/lib/cta-tailwind";
import { cn } from "@/lib/utils";

const trustBarItems = [
  "Companies House Verified",
  "Gas Safe Registered",
  "Public Liability Insured",
  "ID Verified",
  "Founder Reviewed",
] as const;

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden px-6 pb-16 pt-10 sm:pb-20 sm:pt-14 lg:px-8 lg:pb-24 lg:pt-16"
      aria-labelledby="hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FF6B35]/10 via-zinc-950 to-zinc-950"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-[#FF6B35]/15 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#FF6B35]/10 blur-[100px]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <h1
            id="hero-heading"
            className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl"
          >
            Glasgow&apos;s Verified Trade Platform
          </h1>

          <h2 className="mt-4 text-balance text-xl font-medium tracking-tight text-slate-200 sm:text-2xl md:text-3xl">
            One Verified Tradesperson. Matched To Your Job.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            You see their full profile — Companies House, Gas Safe, insurance,
            years of experience, customer-facing bio — BEFORE they contact you.
          </p>

          <div className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
            <Link
              href="/post-a-job"
              className={cn(postJobOrangeSolidCtaClasses, "w-full sm:w-auto")}
              aria-label="Post your job free"
            >
              Post Your Job Free
            </Link>
            <Link
              href="/tradesperson"
              className={cn(
                tradesSignupHeroOutlineCtaClasses,
                "w-full sm:w-auto"
              )}
              aria-label="I'm a tradesperson — sign up"
            >
              I&apos;m a Tradesperson
            </Link>
          </div>

          <div className="mx-auto mt-10 max-w-2xl space-y-3 text-sm text-muted-foreground sm:text-base">
            <p className="font-medium text-foreground">
              No bidding wars. No quote spam. No cowboys.
            </p>
            <p>
              Post your job free. Verified trade reaches out within 24 hours.
            </p>
          </div>

          <ul
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
            aria-label="Verification trust indicators"
          >
            {trustBarItems.map((label) => (
              <li key={label}>
                <TrustBadgePill label={label} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
