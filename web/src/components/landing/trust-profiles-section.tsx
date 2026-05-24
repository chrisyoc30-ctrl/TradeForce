import { TrustBadgePill } from "@/components/landing/trust-badge-pill";
import { LandingSection } from "@/components/landing/landing-section";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const tradeProfiles = [
  {
    tradeType: "Gas Engineer",
    badges: [
      "Founder Reviewed",
      "Gas Safe Registered",
      "Sole Trader Verified",
    ],
    bio: "Boiler installations and bathroom plumbing across Glasgow.",
  },
  {
    tradeType: "Electrician (Ltd Company)",
    badges: ["Founder Reviewed", "Companies House Verified"],
    bio: "Commercial and domestic electrical work.",
  },
  {
    tradeType: "Painter & Decorator",
    badges: ["Founder Reviewed", "Sole Trader Verified"],
    bio: "Interior and exterior decorating, Glasgow-based.",
  },
  {
    tradeType: "Plasterer",
    badges: ["Founder Reviewed", "Sole Trader Verified"],
    bio: "Skimming, plastering, and rendering specialist.",
  },
  {
    tradeType: "Joiner",
    badges: ["Founder Reviewed"],
    bio: "Carpentry, kitchen fitting, and finish work.",
  },
] as const;

export function TrustProfilesSection() {
  return (
    <LandingSection
      id="trust-profiles"
      title="Glasgow Trades Already On TradeScore"
      description="Founder reviewed. Companies House verified. Gas Safe registered."
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tradeProfiles.map(({ tradeType, badges, bio }) => (
          <Card
            key={tradeType}
            className="border-white/10 bg-zinc-900/30 py-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-lg"
          >
            <CardHeader className="gap-3 pb-2">
              <CardTitle className="text-lg font-semibold text-foreground">
                {tradeType}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <TrustBadgePill
                    key={badge}
                    label={badge}
                    className="min-h-9 px-3 py-1.5 text-xs"
                  />
                ))}
              </div>
            </CardHeader>
            <CardContent className="pb-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {bio}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </LandingSection>
  );
}
