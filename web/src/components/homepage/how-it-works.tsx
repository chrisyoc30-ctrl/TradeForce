import { FileText, Cpu, MessageCircle } from "lucide-react";

import { HomepageSection } from "@/components/homepage/section";

const steps = [
  {
    step: "01",
    title: "Submit or browse",
    body: "Homeowners describe the job. Trades review scored leads that fit their trade and area.",
    icon: FileText,
  },
  {
    step: "02",
    title: "AI scores & matches",
    body: "Every request is analysed for quality, urgency, and fit — so you spend time on jobs that matter.",
    icon: Cpu,
  },
  {
    step: "03",
    title: "Get connected",
    body: "Move quickly from match to quote to work, with clear pricing and secure payments when you’re ready.",
    icon: MessageCircle,
  },
] as const;

export function HowItWorks() {
  return (
    <HomepageSection
      id="how-it-works"
      eyebrow="How it works"
      title="Three steps. Less faff. More real jobs."
      description="From first tap to first conversation, we keep the process simple — for homeowners and trades alike."
    >
      <ol className="grid gap-8 lg:grid-cols-3">
        {steps.map(({ step, title, body, icon: Icon }, i) => (
          <li
            key={step}
            className="relative flex flex-col rounded-xl border border-white/10 bg-zinc-900/30 p-6 sm:p-8"
          >
            <span className="absolute right-6 top-6 font-mono text-xs text-[#FF6B35]/80">
              {step}
            </span>
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#FF6B35]/15 text-[#FF6B35]"
              aria-hidden
            >
              <Icon className="h-6 w-6" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              <span className="sr-only">Step {i + 1}: </span>
              {title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {body}
            </p>
          </li>
        ))}
      </ol>
    </HomepageSection>
  );
}
