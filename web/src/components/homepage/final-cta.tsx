import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FinalCta() {
  return (
    <section
      className="px-4 py-16 sm:px-6 sm:py-20"
      aria-labelledby="final-cta-heading"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-[#FF6B35]/25 bg-gradient-to-br from-[#FF6B35]/10 via-zinc-900/60 to-zinc-950 px-6 py-12 text-center sm:px-10 sm:py-14">
        <h2
          id="final-cta-heading"
          className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          Ready to get started?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
          Choose your path — post a job for free, or join trades and try your first
          lead on us.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/lead-capture"
            className={cn(
              buttonVariants({ size: "lg" }),
              "min-h-11 border-0 bg-[#FF6B35] text-white hover:bg-[#e85f2d]"
            )}
          >
            For homeowners
          </Link>
          <Link
            href="/tradesman-signup"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "min-h-11 border-white/20 bg-white/5 hover:bg-white/10"
            )}
          >
            For tradesmen
          </Link>
          <Link
            href="/pricing"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "min-h-11 text-muted-foreground hover:text-foreground"
            )}
          >
            View pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
