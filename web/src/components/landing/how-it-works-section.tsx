import {
  MessageCircle,
  PenLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { LandingSection } from "@/components/landing/landing-section";

const steps = [
  {
    step: 1,
    title: "Post Your Job (Free)",
    description:
      "Tell us what you need done in Glasgow. Takes 2 minutes. No credit card required.",
    icon: PenLine,
  },
  {
    step: 2,
    title: "AI Matches You",
    description:
      "Our algorithm finds the best verified Glasgow tradesperson for your specific job — Companies House, Gas Safe, and insurance verified.",
    icon: Sparkles,
  },
  {
    step: 3,
    title: "Review Their Profile First",
    description:
      "See their verification badges, years of experience, and customer-facing bio BEFORE any contact. Trust pre-loaded.",
    icon: ShieldCheck,
  },
  {
    step: 4,
    title: "Verified Trade Contacts You",
    description:
      "They reach out within 24 hours. Quote, agree timing, get it done. No spam, no chaos.",
    icon: MessageCircle,
  },
] as const;

export function HowItWorksSection() {
  return (
    <LandingSection id="how-it-works" title="How TradeScore Works">
      <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ step, title, description, icon: Icon }) => (
          <li
            key={step}
            className="group flex flex-col rounded-xl border border-white/10 bg-zinc-900/30 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <div
                className="flex size-12 items-center justify-center rounded-lg bg-[#FF6B35]/15 text-[#FF6B35]"
                aria-hidden
              >
                <Icon className="size-6" strokeWidth={2} />
              </div>
              <span className="font-mono text-sm font-medium text-[#FF6B35]/80">
                {String(step).padStart(2, "0")}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              <span className="sr-only">Step {step}: </span>
              {title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </li>
        ))}
      </ol>
    </LandingSection>
  );
}
