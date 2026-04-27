import { GradeBadge, type LeadGrade } from "@/components/leads/grade-badge";
import { cn } from "@/lib/utils";

/** Human-readable labels for `ai_flags` from Flask / lead_scorer. */
export const AI_FLAG_LABELS: Record<string, string> = {
  vague_description: "⚠ Vague description",
  no_budget_signal: "⚠ No budget indicated",
  outside_service_area: "⚠ Outside Glasgow area",
  suspect_contact: "⚠ Contact details suspect",
  duplicate_risk: "⚠ Possible test submission",
};

export interface AIScoreCardProps {
  grade: LeadGrade;
  score: number;
  summary: string;
  reason: string;
  estimatedValue: string;
  flags: string[];
  scoredByAI: boolean;
}

export function AIScoreCard({
  grade,
  score,
  summary,
  reason,
  estimatedValue,
  flags,
  scoredByAI,
}: AIScoreCardProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <GradeBadge grade={grade} size="md" />
        <span className="text-sm tabular-nums text-muted-foreground">
          {Math.round(score)} / 100
        </span>
      </div>
      <p className="text-sm text-foreground/95">{summary}</p>
      <p className="text-xs italic text-muted-foreground">{reason}</p>
      <div
        className={cn(
          "rounded-md border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs text-foreground/90"
        )}
      >
        Est. job value: {estimatedValue}
      </div>
      {flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {flags.map((f) => (
            <span
              key={f}
              className="inline-flex rounded-md border border-amber-500/50 bg-amber-500/15 px-2 py-0.5 text-xs text-amber-950 dark:text-amber-100"
            >
              {AI_FLAG_LABELS[f] ?? f}
            </span>
          ))}
        </div>
      )}
      {!scoredByAI && (
        <p className="text-xs text-muted-foreground">
          Manually reviewed — AI scoring temporarily unavailable
        </p>
      )}
    </div>
  );
}
