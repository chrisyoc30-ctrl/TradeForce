import { LandingSection } from "@/components/landing/landing-section";
import { cn } from "@/lib/utils";

const columns = [
  {
    title: "Other Platforms",
    items: [
      "5-10 trades calling within hours",
      "Bidding wars and quote spam",
      "Cowboys can sign up with minimal vetting",
      "You're left to figure out who's legit",
      "Pay-per-quote-view fees",
      "Decision paralysis from multiple quotes",
    ],
    variant: "muted" as const,
  },
  {
    title: "TradeScore",
    items: [
      "ONE verified trade matched to your job",
      "Algorithm-matched, not bidding-based",
      "Companies House + Gas Safe + insurance checks",
      "Founder personally reviews every trade",
      "First lead always free for trades",
      "Trust pre-loaded — verified profile before contact",
    ],
    variant: "highlight" as const,
  },
  {
    title: "What This Means For You",
    items: [
      "No spam calls in your evenings",
      "No quote chaos to compare",
      "No cowboys in your home",
      "Founder accountability you can call",
      "More trades say YES (no commission pressure)",
      "Decision made in minutes, not days",
    ],
    variant: "muted" as const,
  },
] as const;

export function WhyTradeScoreSection() {
  return (
    <LandingSection
      id="why-tradescore"
      title="Built Different From MyBuilder, Checkatrade, And Bark"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {columns.map(({ title, items, variant }) => (
          <article
            key={title}
            className={cn(
              "rounded-xl border p-6 transition-all duration-200 sm:p-8",
              variant === "highlight"
                ? "border-[#FF6B35]/35 bg-[#FF6B35]/5 shadow-lg ring-1 ring-[#FF6B35]/20 hover:-translate-y-0.5"
                : "border-white/10 bg-zinc-900/30 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-lg"
            )}
          >
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      variant === "highlight" ? "bg-[#FF6B35]" : "bg-zinc-500"
                    )}
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </LandingSection>
  );
}
