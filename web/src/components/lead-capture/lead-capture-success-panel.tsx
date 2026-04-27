import Link from "next/link";
import { Check } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { GradeBadge, type LeadGrade } from "@/components/leads/grade-badge";
import { AI_FLAG_LABELS } from "@/components/leads/ai-score-card";
import { cn } from "@/lib/utils";

function toLeadGrade(grade: string | undefined): LeadGrade {
  const g = (grade ?? "C").toUpperCase();
  if (g === "A" || g === "B" || g === "C") {
    return g;
  }
  return "C";
}

function gradeMessage(grade: LeadGrade): string {
  if (grade === "A") {
    return "Strong interest expected from Glasgow trades.";
  }
  if (grade === "B") {
    return "Add more detail to attract better quotes.";
  }
  return "More specifics will improve your responses.";
}

export type LeadCaptureSuccessData = {
  leadId: string;
  aiGrade: string;
  aiScore: number;
  aiSummary: string;
  aiReason: string;
  aiEstimatedValue: string;
  aiFlags: string[];
  aiScoredByAI: boolean;
};

type Props = {
  data: LeadCaptureSuccessData;
  onPostAnother: () => void;
};

export function LeadCaptureSuccessPanel({ data, onPostAnother }: Props) {
  const g = toLeadGrade(data.aiScoredByAI ? data.aiGrade : "C");
  const scored = data.aiScoredByAI;

  return (
    <div
      className="space-y-6 rounded-lg border border-emerald-500/30 bg-card p-6 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-500/50">
          <Check className="h-8 w-8 text-emerald-400" strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          Your job has been submitted
        </h2>
      </div>

      {!scored ? (
        <p className="text-center text-sm text-foreground/90">
          Your job has been received — we&apos;ll match it to tradespeople
          shortly.
        </p>
      ) : (
        <>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
            <GradeBadge grade={g} size="md" />
            <span className="text-sm font-medium text-muted-foreground">
              <span className="text-foreground">Score: </span>
              {Math.round(data.aiScore)} / 100
            </span>
          </div>
          <p className="whitespace-pre-wrap text-center text-sm text-foreground/90">
            {data.aiSummary}
          </p>
          {data.aiReason.trim() ? (
            <p className="text-center text-xs italic text-muted-foreground">
              {data.aiReason.trim()}
            </p>
          ) : null}
          <p className="rounded-md border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-center text-sm text-foreground/90">
            Est. job value: {data.aiEstimatedValue}
          </p>
          {data.aiFlags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {data.aiFlags.map((flag) => (
                <span
                  key={flag}
                  className="inline-flex rounded-md border border-amber-500/50 bg-amber-500/15 px-2 py-0.5 text-xs text-amber-950 dark:text-amber-100"
                >
                  {AI_FLAG_LABELS[flag] ?? flag}
                </span>
              ))}
            </div>
          )}
          <p className="text-center text-sm text-foreground/90">
            {gradeMessage(g)}
          </p>
        </>
      )}

      <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-left text-sm text-foreground/90">
        <p className="font-medium text-foreground">What happens next</p>
        <p className="mt-1 text-muted-foreground">
          Matched tradespeople will be notified. Expect to hear within 24
          hours.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
        {data.leadId ? (
          <Link
            href={`/leads/${encodeURIComponent(data.leadId)}`}
            className={cn(
              buttonVariants({ variant: "secondary" }),
              "w-full justify-center sm:w-auto"
            )}
          >
            View project
          </Link>
        ) : null}
        <Link
          href="/homeowner-dashboard"
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "w-full justify-center sm:w-auto"
          )}
        >
          View your dashboard
        </Link>
        <Button
          type="button"
          className={cn(buttonVariants(), "w-full sm:w-auto")}
          onClick={onPostAnother}
        >
          Post another job
        </Button>
      </div>
    </div>
  );
}
