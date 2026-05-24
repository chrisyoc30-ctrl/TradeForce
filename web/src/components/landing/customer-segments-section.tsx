import {
  Briefcase,
  Building2,
  Home,
  KeyRound,
  Users,
} from "lucide-react";

import { LandingSection } from "@/components/landing/landing-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const segments = [
  {
    title: "Homeowners",
    subtitle: "Renovations, repairs, emergencies",
    icon: Home,
  },
  {
    title: "Landlords",
    subtitle: "Property maintenance, refurbishment, regulatory work",
    icon: Building2,
  },
  {
    title: "Small Businesses",
    subtitle: "Commercial premises, fit-outs, ongoing maintenance",
    icon: Briefcase,
  },
  {
    title: "Property Managers",
    subtitle: "Multi-property maintenance, quick turnarounds",
    icon: KeyRound,
  },
  {
    title: "Community Organizations",
    subtitle: "Charities, churches, community centres",
    icon: Users,
  },
] as const;

export function CustomerSegmentsSection() {
  return (
    <LandingSection
      id="customer-segments"
      title="Glasgow's Verified Trade Platform For:"
      variant="muted"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {segments.map(({ title, subtitle, icon: Icon }) => (
          <Card
            key={title}
            className="border-white/10 bg-zinc-950/60 py-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FF6B35]/30 hover:shadow-lg"
          >
            <CardHeader className="gap-3 pb-2">
              <div
                className="flex size-11 items-center justify-center rounded-lg bg-[#FF6B35]/15 text-[#FF6B35]"
                aria-hidden
              >
                <Icon className="size-5" strokeWidth={2} />
              </div>
              <CardTitle className="text-base font-semibold text-foreground">
                {title}
              </CardTitle>
              <CardDescription className="text-sm leading-snug">
                {subtitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-5" />
          </Card>
        ))}
      </div>
    </LandingSection>
  );
}
