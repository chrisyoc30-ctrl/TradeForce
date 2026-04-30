import Link from "next/link";
import { Home, Sparkles, Users } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HomeHero() {
  return (
    <section
      className="relative overflow-hidden px-4 pb-20 pt-12 sm:pb-28 sm:pt-16 lg:pb-32 lg:pt-20"
      aria-labelledby="hero-heading"
    >
      {/* Background gradient + pattern */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900/95 to-zinc-950"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-[#FF6B35]/15 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-[#FF6B35]/10 blur-[90px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:48px_48px]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/25 bg-[#FF6B35]/10 px-3 py-1 text-xs font-medium text-[#FF6B35] sm:text-sm">
          <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Glasgow&apos;s intelligent lead platform
        </p>

        <h1
          id="hero-heading"
          className="max-w-4xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
        >
          Stop Competing With 10 Other Glasgow Trades
        </h1>

        <p className="mt-6 max-w-2xl text-pretty text-lg text-slate-200 sm:text-xl">
          AI-Powered Lead Matching. Quality Projects. Instant Payments.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="/lead-capture"
            className={cn(
              buttonVariants({ size: "lg" }),
              "inline-flex min-h-11 items-center justify-center gap-2 border-0 bg-[#FF6B35] px-8 text-base font-semibold text-white shadow-lg shadow-[#FF6B35]/20 transition hover:bg-[#e85f2d]"
            )}
            aria-label="Post a job — free for homeowners"
          >
            <Home className="size-5 shrink-0" aria-hidden />
            Post a Job (FREE)
          </Link>
          <Link
            href="/tradesman-signup"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "inline-flex min-h-11 items-center justify-center gap-2 border-white/20 bg-white/5 px-8 text-base font-semibold backdrop-blur-sm transition hover:bg-white/10"
            )}
            aria-label="Sign up as a Glasgow tradesperson"
          >
            <Users className="size-5 shrink-0" aria-hidden />
            Sign Up as Tradesperson
          </Link>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Homeowners post for <span className="font-medium text-foreground">free</span>
          . Trades pay{" "}
          <span className="font-medium text-foreground">£25 per lead</span> after
          their first free lead — no commission.
        </p>
      </div>
    </section>
  );
}
