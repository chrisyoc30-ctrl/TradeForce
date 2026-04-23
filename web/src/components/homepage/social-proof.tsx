import { BadgeCheck, Lock, TrendingUp } from "lucide-react";

import { HomepageSection } from "@/components/homepage/section";

const stats = [
  { value: "2,500+", label: "Tradesmen ready" },
  { value: "5,000+", label: "Projects matched" },
  { value: "£2.5M+", label: "Value generated" },
] as const;

const testimonials = [
  {
    quote:
      "Finally stopped chasing tyre-kickers. The scored leads actually show up and want work done.",
    name: "James R.",
    role: "Plumber, Glasgow South",
  },
  {
    quote:
      "Posted one evening, had three solid quotes by lunch. No endless phone tag.",
    name: "Laura M.",
    role: "Homeowner, West End",
  },
  {
    quote:
      "Flat fee per lead beats losing margin on commission. I pick the jobs I want.",
    name: "Ahmad K.",
    role: "Electrician, Greater Glasgow",
  },
] as const;

const badges = [
  { label: "Verified trades", icon: BadgeCheck },
  { label: "Secure payments", icon: Lock },
  { label: "Real results", icon: TrendingUp },
] as const;

export function SocialProof() {
  return (
    <HomepageSection
      id="proof"
      eyebrow="Social proof"
      title="Trusted by people who value their time"
      description="We’re growing fast across Glasgow — here’s what early users are saying."
      className="border-y border-white/5 bg-zinc-900/20"
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <ul
            className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-1 lg:gap-8"
            aria-label="Platform statistics"
          >
            {stats.map(({ value, label }) => (
              <li
                key={label}
                className="rounded-xl border border-white/10 bg-zinc-950/50 px-5 py-4 text-center sm:text-left"
              >
                <p className="text-3xl font-semibold tabular-nums text-[#FF6B35]">
                  {value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{label}</p>
              </li>
            ))}
          </ul>

          <ul
            className="mt-8 flex flex-wrap justify-center gap-3 sm:justify-start"
            aria-label="Trust badges"
          >
            {badges.map(({ label, icon: Icon }) => (
              <li
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-muted-foreground"
              >
                <Icon className="h-3.5 w-3.5 text-[#FF6B35]" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <ul className="space-y-4" aria-label="Testimonials">
          {testimonials.map(({ quote, name, role }) => (
            <li
              key={name}
              className="rounded-xl border border-white/10 bg-zinc-950/40 p-5 sm:p-6"
            >
              <blockquote className="text-sm leading-relaxed text-foreground/90 sm:text-base">
                &ldquo;{quote}&rdquo;
              </blockquote>
              <footer className="mt-4 text-xs text-muted-foreground sm:text-sm">
                <cite className="font-medium not-italic text-foreground">{name}</cite>
                <span className="text-muted-foreground"> — {role}</span>
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </HomepageSection>
  );
}
