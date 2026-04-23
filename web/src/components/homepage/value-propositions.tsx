import { Home, HardHat, ShieldCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { HomepageSection } from "@/components/homepage/section";

const items = [
  {
    title: "For homeowners",
    body: "Find verified tradesmen instantly. No haggling. No bad surprises.",
    icon: Home,
  },
  {
    title: "For tradesmen",
    body: "Get quality leads matched to YOUR skills. No competing with 10 others.",
    icon: HardHat,
  },
  {
    title: "For both",
    body: "Transparent pricing. Secure payments. Real results.",
    icon: ShieldCheck,
  },
] as const;

export function ValuePropositions() {
  return (
    <HomepageSection
      id="value"
      eyebrow="Why TradeScore"
      title="Built for trust, speed, and fair matches"
      description="Whether you’re posting a job or filling your diary, we cut the noise so serious work finds serious pros."
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ title, body, icon: Icon }) => (
          <Card
            key={title}
            className="border-white/10 bg-zinc-900/40 ring-1 ring-white/5 transition-colors hover:border-[#FF6B35]/25 hover:ring-[#FF6B35]/10"
          >
            <CardContent className="flex flex-col gap-4 p-6 sm:p-8">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#FF6B35]/15 text-[#FF6B35]"
                aria-hidden
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </HomepageSection>
  );
}
