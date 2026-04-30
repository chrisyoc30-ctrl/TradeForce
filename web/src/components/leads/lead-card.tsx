"use client";
import { useEffect, useState } from "react";

import Link from "next/link";

import { AIScoreCard } from "@/components/leads/ai-score-card";
import { MatchStatusPill } from "@/components/leads/match-status-pill";
import { useFirstFreeLeadEligibility } from "@/components/leads/use-first-free-lead";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { Lead } from "@/types/lead";
import { projectTypeLabel, locationLabel } from "@/components/leads/lead-helpers";
import { cn } from "@/lib/utils";
import type { LeadGrade } from "@/components/leads/grade-badge";

function toDisplayGrade(grade: string | undefined): LeadGrade {
  const g = (grade ?? "C").toUpperCase();
  if (g === "A" || g === "B" || g === "C") return g;
  return "C";
}

const TS_ID_STORAGE = "tradescore-tradesperson-id";

function readStoredTradespersonId(): string {
  if (typeof window === "undefined") return "";
  return (window.localStorage.getItem(TS_ID_STORAGE) ?? "").trim();
}

export type LeadCardProps = {
  lead: Lead;
};

export function LeadCard({ lead }: LeadCardProps) {
  const eligibleFree = useFirstFreeLeadEligibility();
  const [viewerId, setViewerId] = useState("");
  useEffect(() => {
    setViewerId(readStoredTradespersonId());
  }, []);

  const matchRaw = lead.matchStatus;
  const matchStatus =
    typeof matchRaw === "string"
      ? matchRaw.trim().toLowerCase() || undefined
      : undefined;
  const matchedFor = String(lead.matchedTradespersonId ?? "").trim();
  const reservedOther =
    matchStatus === "reserved" &&
    !!matchedFor &&
    (!viewerId || viewerId !== matchedFor);
  const grade = toDisplayGrade(lead.aiGrade);
  const score = Math.round(lead.aiScore ?? 0);
  const summary =
    lead.aiSummary?.trim() ||
    (lead.description ? String(lead.description).slice(0, 280) : "—");
  const reason =
    lead.aiReason?.trim() ||
    "This lead is listed for local tradespeople based on the details provided.";
  const est =
    lead.aiEstimatedValue?.trim() || "Unable to estimate";
  const flags = lead.aiFlags ?? [];
  const scoredByAI = lead.aiScoredByAI !== false;

  return (
    <Card className="flex h-full flex-col border-border/60 transition [transition-duration:200ms] hover:-translate-y-0.5 hover:border-amber-500/30 hover:shadow-md">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-base font-bold text-foreground">
            {projectTypeLabel(lead)}
          </h2>
          <MatchStatusPill
            matchStatus={matchStatus}
            reservedUntil={lead.reservedUntil}
          />
        </div>
        <p className="text-sm text-muted-foreground">{locationLabel(lead)}</p>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <AIScoreCard
          grade={grade}
          score={score}
          summary={summary}
          reason={reason}
          estimatedValue={est}
          flags={flags}
          scoredByAI={scoredByAI}
        />
      </CardContent>
      <CardFooter className="mt-auto flex flex-col gap-2 border-t border-border/50 pt-3">
        {reservedOther ? (
          <div className="w-full rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-center text-sm text-muted-foreground">
            Currently reserved for another tradesperson
          </div>
        ) : (
          <Link
            href={`/leads/${encodeURIComponent(lead.id)}/accept`}
            className={cn(
              buttonVariants({ variant: "default" }),
              "w-full justify-center",
              eligibleFree &&
                "bg-emerald-600 text-white hover:bg-emerald-700"
            )}
          >
            {eligibleFree ? "Claim free lead" : "Accept lead — £25"}
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
