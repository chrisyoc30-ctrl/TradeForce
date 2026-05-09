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
  const scored = data.aiScoredByAI;
  const g = toLeadGrade(data.aiGrade);

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
          Job posted successfully
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          We&apos;re matching you with a Glasgow tradesperson now. Here&apos;s what happens next —
          and how verification protects you.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            AI grade
          </span>
          <GradeBadge grade={g} size="md" />
        </div>
        {scored ? (
          <span className="text-sm font-medium text-muted-foreground">
            <span className="text-foreground">Score: </span>
            {Math.round(data.aiScore)} / 100
          </span>
        ) : (
          <p className="max-w-xs text-center text-sm text-muted-foreground">
            Full AI scoring will appear shortly — we&apos;ve queued your job.
          </p>
        )}
      </div>

      {scored ? (
        <>
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
      ) : (
        <p className="text-center text-sm text-foreground/90">
          Your job has been received — we&apos;ll match it to tradespeople shortly.
        </p>
      )}

      <div className="rounded-lg border border-sky-500/25 bg-sky-500/5 p-5 text-left dark:bg-sky-500/10">
        <p className="font-semibold text-foreground">What happens next</p>
        <div className="mt-4 space-y-4">
          <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FF6B35] text-xs font-bold text-white">
              1
            </div>
            <div>
              <p className="font-medium text-foreground">We verify the match</p>
              <p className="text-sm text-muted-foreground">
                Our engine finds the best-fit Glasgow tradesperson. You&apos;ll see Companies House
                and any completed ID / insurance badges on their profile when you view the job.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FF6B35] text-xs font-bold text-white">
              2
            </div>
            <div>
              <p className="font-medium text-foreground">They accept your job</p>
              <p className="text-sm text-muted-foreground">
                They review your brief and confirm they can take it on. Your phone and email stay
                private until this step completes.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FF6B35] text-xs font-bold text-white">
              3
            </div>
            <div>
              <p className="font-medium text-foreground">They contact you directly</p>
              <p className="text-sm text-muted-foreground">
                After acceptance, they can reach you to arrange a visit and quote — still no
                bidding war from a dozen random callers.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-muted/25 p-4 text-sm">
        <p className="font-medium text-foreground">Why TradeScore is different</p>
        <ul className="mt-2 space-y-1.5 text-muted-foreground">
          <li className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
            <span>Verification signals you can read on the matched profile</span>
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
            <span>Details stay private until the match accepts</span>
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
            <span>One matched tradesperson per job — no auction chaos</span>
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
            <span>Glasgow-focused for local accountability</span>
          </li>
        </ul>
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
