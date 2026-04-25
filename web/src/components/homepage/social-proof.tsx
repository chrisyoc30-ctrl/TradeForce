import Link from "next/link";

import { Banknote, Percent, HandCoins } from "lucide-react";

import { HomepageSection } from "@/components/homepage/section";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const launchStats = [
  { value: "Free", label: "Always free for homeowners", icon: HandCoins },
  { value: "£25", label: "Flat fee per lead for trades", icon: Banknote },
  { value: "0%", label: "Commission on your work", icon: Percent },
] as const;

export function SocialProof() {
  return (
    <HomepageSection
      id="proof"
      eyebrow="How we work"
      title="Launching across Glasgow"
      description="Upfront, honest numbers — we’re building with trades and homeowners, not padding stats."
      className="border-y border-white/5 bg-zinc-900/20"
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <ul
            className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-1 lg:gap-8"
            aria-label="Platform pricing snapshot"
          >
            {launchStats.map(({ value, label, icon: Icon }) => (
              <li
                key={label}
                className="rounded-xl border border-white/10 bg-zinc-950/50 px-5 py-4 text-center sm:text-left"
              >
                <Icon
                  className="mx-auto mb-2 h-5 w-5 text-[#FF6B35] sm:mx-0"
                  aria-hidden
                />
                <p className="text-2xl font-semibold tabular-nums text-[#FF6B35] sm:text-3xl">
                  {value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{label}</p>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="flex flex-col justify-center rounded-2xl border border-[#FF6B35]/30 bg-zinc-950/60 px-6 py-8 text-center sm:px-8"
          aria-labelledby="waitlist-heading"
        >
          <h2
            id="waitlist-heading"
            className="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
          >
            Be one of our first tradespeople in Glasgow
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            We&apos;re onboarding a small group of quality tradespeople before
            our public launch. First lead is on us.
          </p>
          <Link
            href="/tradesman-signup"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-6 inline-flex justify-center border-0 bg-[#FF6B35] text-white hover:bg-[#e85f2d]"
            )}
          >
            Join the early access list
          </Link>
        </div>
      </div>
    </HomepageSection>
  );
}
