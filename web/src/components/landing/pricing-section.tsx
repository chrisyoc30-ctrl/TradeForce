import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LandingSection } from "@/components/landing/landing-section";
import { cn } from "@/lib/utils";

const pricingPlans = [
  {
    title: "Glasgow Customers",
    price: "Free Forever",
    subText: null,
    features: [
      "Post unlimited jobs",
      "Get matched to verified trades",
      "See full profiles before contact",
      "No hidden fees",
      "No spam",
    ],
    emphasize: false,
  },
  {
    title: "Tradespeople — Pay Per Lead",
    price: "£25 per accepted lead",
    subText: "First lead always FREE",
    features: [
      "No commission ever",
      "No quote-view fees",
      "One job per trade per match",
      "Cancel anytime",
      "Founder onboarding",
    ],
    emphasize: true,
  },
  {
    title: "Tradespeople — Unlimited",
    price: "£99/month",
    subText: "Unlimited accepted leads",
    features: [
      "All pay-per-lead benefits included",
      "No per-lead cost",
      "Priority matching",
      "Monthly cancel option",
      "Cancel anytime",
    ],
    emphasize: false,
  },
] as const;

export function PricingSection() {
  return (
    <LandingSection
      id="pricing"
      title="Simple, Honest Pricing"
      description="Customers always free. Tradespeople pay only when they win work."
      variant="muted"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {pricingPlans.map(({ title, price, subText, features, emphasize }) => (
          <Card
            key={title}
            className={cn(
              "border-white/10 bg-zinc-950/60 py-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
              emphasize &&
                "border-[#FF6B35]/35 ring-1 ring-[#FF6B35]/20 bg-[#FF6B35]/5"
            )}
          >
            <CardHeader className="gap-2 pb-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {title}
              </p>
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                {price}
              </CardTitle>
              {subText ? (
                <CardDescription className="text-sm font-medium text-[#FF6B35]">
                  {subText}
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="pb-6">
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {features.map((feature) => (
                  <li key={feature} className="flex gap-2 leading-snug">
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-400"
                      aria-hidden
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </LandingSection>
  );
}
