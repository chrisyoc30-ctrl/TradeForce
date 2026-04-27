"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import confetti from "canvas-confetti";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { GradeBadge, type LeadGrade } from "@/components/leads/grade-badge";
import { AI_FLAG_LABELS } from "@/components/leads/ai-score-card";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId?: string | null;
  onSubmitAnother: () => void;
  aiScoredByAI: boolean;
  /** When AI scored, expected A / B / C. */
  aiGrade: string;
  aiSummary: string;
  aiReason: string;
  aiEstimatedValue: string;
  aiFlags: string[];
};

function toLeadGrade(grade: string | undefined): LeadGrade {
  const g = (grade ?? "C").toUpperCase();
  if (g === "A" || g === "B" || g === "C") return g;
  return "C";
}

function gradeMessage(grade: LeadGrade): string {
  if (grade === "A") {
    return "Your job description is clear and detailed. We expect strong interest from qualified Glasgow tradespeople.";
  }
  if (grade === "B") {
    return "Your job has been listed. You may receive more responses if you add more detail about your timeline or budget.";
  }
  return "Your job has been listed, but the description could be more specific. Consider editing it to attract better quotes.";
}

function fireConfetti(grade: string) {
  const g = grade.toUpperCase();
  if (g !== "A" && g !== "B") return;
  const count = g === "A" ? 160 : 90;
  confetti({
    particleCount: count,
    spread: 70,
    origin: { y: 0.55 },
    zIndex: 2000,
  });
}

export function LeadSubmissionSuccessDialog({
  open,
  onOpenChange,
  leadId,
  onSubmitAnother,
  aiScoredByAI,
  aiGrade,
  aiSummary,
  aiReason,
  aiEstimatedValue,
  aiFlags,
}: Props) {
  const g = toLeadGrade(aiScoredByAI ? aiGrade : "C");
  const fired = useRef(false);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => onOpenChange(false), 8000);
    return () => clearTimeout(t);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      fired.current = false;
      return;
    }
    if (aiScoredByAI && !fired.current) {
      fireConfetti(aiGrade);
      fired.current = true;
    }
  }, [aiGrade, aiScoredByAI, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[min(90vh,800px)] overflow-y-auto border-border/80 sm:max-w-md"
        showCloseButton
      >
        <DialogHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-500/50">
            <Check className="h-8 w-8 text-emerald-400" strokeWidth={3} />
          </div>
          <DialogTitle className="pt-2 text-center text-2xl font-bold tracking-tight">
            {aiScoredByAI ? "Your job has been scored" : "Your job has been received"}
          </DialogTitle>
        </DialogHeader>

        {!aiScoredByAI ? (
          <p className="text-balance text-center text-sm text-foreground/90">
            Your job has been received — we&apos;ll match it to tradespeople
            shortly.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <p className="text-lg font-semibold text-foreground">
                Your lead grade
              </p>
              <GradeBadge grade={g} size="md" />
            </div>
            <p className="text-balance text-center text-sm text-foreground/90">
              {aiSummary}
            </p>
            {aiReason.trim() ? (
              <p className="text-balance text-center text-xs italic text-muted-foreground">
                {aiReason.trim()}
              </p>
            ) : null}
            <p className="rounded-md border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-center text-xs text-foreground/90">
              Est. job value: {aiEstimatedValue}
            </p>
            {aiFlags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {aiFlags.map((flag) => (
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
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-left text-sm text-foreground/90">
              <p className="font-medium text-foreground">What happens next</p>
              <p className="mt-1 text-muted-foreground">
                Matched tradespeople will be notified. You can expect to hear
                from them within 24 hours. Check your phone for messages.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap sm:justify-center">
          {leadId ? (
            <Link
              href={`/leads/${encodeURIComponent(leadId)}`}
              className={cn(
                buttonVariants(),
                "w-full justify-center sm:w-auto"
              )}
            >
              View project & matches
            </Link>
          ) : null}
          <Link
            href="/homeowner-dashboard"
            className={cn(
              buttonVariants({ variant: leadId ? "secondary" : "default" }),
              "w-full justify-center sm:w-auto"
            )}
          >
            View your dashboard
          </Link>
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => {
              onOpenChange(false);
              onSubmitAnother();
            }}
          >
            Submit another job
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={cn("w-full sm:w-auto")}
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
