import Link from "next/link";

import {
  postJobOrangeSolidCtaClasses,
  tradesSignupHeroOutlineCtaClasses,
} from "@/lib/cta-tailwind";
import { cn } from "@/lib/utils";

export function FinalCtaSection() {
  return (
    <section
      id="final-cta"
      aria-labelledby="final-cta-heading"
      className="border-t border-white/10 px-6 py-16 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#FF6B35]/25 bg-gradient-to-b from-[#FF6B35]/10 to-zinc-900/40 px-6 py-12 text-center sm:px-10 sm:py-16">
          <h2
            id="final-cta-heading"
            className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
          >
            Ready to Skip the Quote Chaos?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            Get matched to one verified Glasgow tradesperson. No bidding wars.
          </p>

          <div className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
            <Link
              href="/post-a-job"
              className={cn(
                postJobOrangeSolidCtaClasses,
                "min-h-[56px] w-full px-10 py-5 text-lg sm:w-auto"
              )}
              aria-label="Post your job free"
            >
              Post Your Job Free
            </Link>
            <Link
              href="/tradesperson"
              className={cn(
                tradesSignupHeroOutlineCtaClasses,
                "min-h-[56px] w-full px-10 py-5 text-lg sm:w-auto"
              )}
              aria-label="Join as a tradesperson"
            >
              Join as a Tradesperson
            </Link>
          </div>

          <p className="mt-10 text-sm text-muted-foreground">
            Made by Christopher in Glasgow. Founder accountability you can
            email:{" "}
            <a
              href="mailto:support@tradescore.uk"
              className="font-medium text-[#FF6B35] underline-offset-4 hover:underline"
            >
              support@tradescore.uk
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
