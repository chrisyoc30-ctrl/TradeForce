"use client";

import { useMemo } from "react";
import { Calculator, HelpCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  type ProjectComplexity,
  calculateQuoteEstimate,
} from "@/lib/quote-estimate";

type Props = {
  projectType: string;
  description: string;
  budget: string;
  timeline: string;
  complexity: ProjectComplexity;
};

function factorTip(title: string, body: string) {
  return (
    <Tooltip>
      <TooltipTrigger className="inline-flex cursor-help text-muted-foreground hover:text-foreground">
        <span className="sr-only">{title}</span>
        <HelpCircle className="h-3.5 w-3.5" aria-hidden />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{body}</TooltipContent>
    </Tooltip>
  );
}

export function QuoteEstimator({
  projectType,
  description,
  budget,
  timeline,
  complexity,
}: Props) {
  const canShow = projectType.trim().length > 0 && description.trim().length > 0;
  const q = useMemo(
    () => calculateQuoteEstimate(budget, timeline, complexity),
    [budget, complexity, timeline]
  );

  const borderClass =
    q.priorityBand === "high"
      ? "border-red-500/40 ring-red-500/20"
      : q.priorityBand === "low"
        ? "border-emerald-500/35 ring-emerald-500/10"
        : "border-amber-500/35 ring-amber-500/10";

  return (
    <Card
        className={cn(
          "border transition-[box-shadow,transform] duration-300 ease-out",
          canShow && "hover:shadow-md",
          canShow ? borderClass : "opacity-60"
        )}
        aria-disabled={!canShow}
    >
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
          <Calculator className="h-5 w-5 text-amber-400" aria-hidden />
          <CardTitle className="text-base">Estimated quote range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {!canShow && (
            <p className="text-muted-foreground">Not enough information</p>
          )}
          {canShow && (
            <div
              key={`${q.min}-${q.max}-${q.mid}`}
              className="animate-in fade-in-0 zoom-in-95 duration-200"
            >
              <p className="text-2xl font-semibold tabular-nums text-foreground">
                £{q.min} – £{q.max}
              </p>
              <p className="text-xs text-muted-foreground">
                Midpoint ≈ £{Math.round(q.mid)} (illustrative range ±15%)
              </p>
            </div>
          )}
          {canShow && (
            <ul className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
              <li className="flex justify-between gap-2">
                <span className="flex items-center gap-1">
                  Base price
                  {factorTip("Base", "Fixed platform benchmark starting at £50.")}
                </span>
                <span className="text-foreground/90">£{q.base}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="flex items-center gap-1 text-left">
                  Budget adjustment
                  {factorTip(
                    "Budget adjustment",
                    "Adds 20% of the base for budgets over £1,000, or 40% for budgets over £5,000 (applied to the base only)."
                  )}
                </span>
                <span className="text-foreground/90 text-right">
                  {q.budgetAdjustment > 0
                    ? `+£${q.budgetAdjustment} (${q.budgetAdjustmentLabel})`
                    : "£0"}
                </span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="flex items-center gap-1">
                  Complexity
                  {factorTip(
                    "Project complexity",
                    "Simple 1×, medium 1.5×, complex 2× — scales labour and scope."
                  )}
                </span>
                <span className="text-foreground/90">×{q.complexityMultiplier}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="flex items-center gap-1 text-left">
                  Timeline
                  {factorTip("Timeline", q.timelineLabel)}
                </span>
                <span className="text-foreground/90">×{q.timelineMultiplier}</span>
              </li>
            </ul>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">
            Final quotes from tradesmen may vary based on site inspection.
          </p>
        </CardContent>
    </Card>
  );
}
