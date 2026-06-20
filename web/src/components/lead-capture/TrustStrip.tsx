import { BadgeCheck, Gift, MapPin, ShieldCheck } from "lucide-react";

/**
 * Honest, factual trust strip shown above the lead-capture form.
 *
 * Presentational only — no client JS, no data fetch, no fabricated
 * reviews/testimonials. Every claim is verifiable. A live "N verified trades"
 * chip is a deferred fast-follow for when the roster is larger (≥50) —
 * see TradeScore-Ops/todo/funnel-followup.md.
 */
const ITEMS = [
  { icon: ShieldCheck, label: "Companies House + Gas Safe checks" },
  { icon: MapPin, label: "Glasgow-based, founder-vetted" },
  { icon: Gift, label: "First lead free" },
  { icon: BadgeCheck, label: "Verified trades only" },
] as const;

export function TrustStrip() {
  return (
    <ul
      aria-label="Why TradeScore"
      className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"
    >
      {ITEMS.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground sm:text-sm"
        >
          <Icon className="size-4 shrink-0 text-[#FF5D04]" aria-hidden />
          <span className="leading-tight">{label}</span>
        </li>
      ))}
    </ul>
  );
}
