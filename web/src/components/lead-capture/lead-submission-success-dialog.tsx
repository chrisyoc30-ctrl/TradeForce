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
import { Progress } from "@/components/ui/progress";
import { gradeClass, priorityMessage } from "@/lib/grade-styles";
import type { ScoreBreakdown } from "@/lib/quote-estimate";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  aiGrade: string;
  aiScore: number;
  scoreBreakdown: ScoreBreakdown;
  onSubmitAnother: () => void;
  /** When set, links to full project page with matches and bids. */
  leadId?: string | null;
};

const FACTORS: { key: keyof ScoreBreakdown; label: string; weight: string }[] = [
  { key: "contactQuality", label: "Contact quality", weight: "20%" },
  { key: "projectValue", label: "Project value", weight: "25%" },
  { key: "urgency", label: "Urgency", weight: "20%" },
  { key: "budget", label: "Budget", weight: "20%" },
  { key: "timeline", label: "Timeline", weight: "15%" },
];

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
  aiGrade,
  aiScore,
  scoreBreakdown,
  onSubmitAnother,
  leadId,
}: Props) {
  const g = gradeClass(aiGrade);
  const hex = g.hex;
  const fired = useRef(false);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => onOpenChange(false), 5000);
    return () => clearTimeout(t);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      fired.current = false;
      return;
    }
    if (!fired.current) {
      fireConfetti(aiGrade);
      fired.current = true;
    }
  }, [aiGrade, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[min(90vh,800px)] overflow-y-auto border-border/80 sm:max-w-md"
        style={{ borderColor: `color-mix(in oklab, ${hex} 35%, transparent)` }}
        showCloseButton
      >
        <DialogHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-500/50">
            <Check className="h-8 w-8 text-emerald-400" strokeWidth={3} />
          </div>
          <DialogTitle
            className="pt-2 text-center text-2xl font-bold tracking-tight"
            style={{ color: hex }}
          >
            Your Job is {aiGrade.toUpperCase()} Priority!
          </DialogTitle>
        </DialogHeader>
        <p className="text-balance text-center text-sm text-foreground/90">
          Your job has been posted. We&apos;ll match it to relevant tradespeople
          in Glasgow — you should hear from them within 24 hours. Check your
          phone for quotes.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Quality Score: {aiScore}/100
        </p>
        <p className="text-center text-sm text-foreground/90">
          {priorityMessage(aiGrade)}
        </p>

        <div className="space-y-3 py-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            What drove your score
          </p>
          {FACTORS.map((row) => (
            <div key={row.key} className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {row.label}{" "}
                  <span className="text-foreground/60">({row.weight})</span>
                </span>
                <span>{Math.round(scoreBreakdown[row.key] ?? 0)}</span>
              </div>
              <Progress
                className="h-2"
                value={Math.min(100, Math.max(0, scoreBreakdown[row.key] ?? 0))}
              />
            </div>
          ))}
        </div>

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
