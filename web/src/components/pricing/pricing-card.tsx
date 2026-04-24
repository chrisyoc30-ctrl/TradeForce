import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PricingCardProps = {
  title: string;
  priceLabel: string;
  summary: string;
  points: readonly string[];
  className?: string;
  /** Visually highlight the trades card on the homepage */
  emphasize?: boolean;
};

export function PricingCard({
  title,
  priceLabel,
  summary,
  points,
  className,
  emphasize,
}: PricingCardProps) {
  return (
    <Card
      className={cn(
        emphasize &&
          "border-[#FF6B35]/35 ring-1 ring-[#FF6B35]/20 bg-card/80",
        className
      )}
    >
      <CardHeader className="gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-200">
          {title}
        </p>
        <CardTitle className="text-2xl font-semibold tracking-tight text-slate-200">
          {priceLabel}
        </CardTitle>
        <CardDescription className="text-sm text-foreground/85">
          {summary}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
          {points.map((line) => (
            <li key={line} className="leading-snug">
              {line}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
