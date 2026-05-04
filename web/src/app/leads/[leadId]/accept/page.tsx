"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";

import { trpc } from "@/trpc/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GradeBadge, type LeadGrade } from "@/components/leads/grade-badge";
import { LeadAcceptPayment } from "@/components/leads/lead-accept-payment";
import { AI_FLAG_LABELS } from "@/components/leads/ai-score-card";
import {
  projectTypeLabel,
  locationLabel,
} from "@/components/leads/lead-helpers";
import { cn } from "@/lib/utils";

function toLeadGrade(grade: string | undefined): LeadGrade {
  const g = (grade ?? "C").toUpperCase();
  if (g === "A" || g === "B" || g === "C") {
    return g;
  }
  return "C";
}

export default function AcceptLeadPage() {
  const params = useParams();
  const leadId = typeof params.leadId === "string" ? params.leadId : "";
  const utils = trpc.useUtils();

  const { data: lead, isLoading, isError, error, refetch } =
    trpc.leads.getById.useQuery(
      { id: leadId },
      { enabled: Boolean(leadId) }
    );

  if (!leadId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted-foreground">
        Invalid lead link.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading lead…
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center text-sm text-muted-foreground">
        <p role="alert">{error?.message ?? "Lead not found."}</p>
        <Button type="button" variant="secondary" onClick={() => void refetch()}>
          Try again
        </Button>
        <Link
          href="/lead-scoring"
          className={cn(buttonVariants({ variant: "link" }), "block")}
        >
          Back to available leads
        </Link>
      </div>
    );
  }

  const grade = toLeadGrade(lead.aiGrade);
  const score = Math.round(lead.aiScore ?? 0);
  const summary = lead.aiSummary?.trim() || "—";
  const reason = lead.aiReason?.trim() || "";
  const est = lead.aiEstimatedValue?.trim() || "Unable to estimate";
  const flags = lead.aiFlags ?? [];
  const scoredBy = lead.aiScoredByAI !== false;

  return (
    <div className="min-h-dvh bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <Link
            href="/lead-scoring"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to lead board
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg">
              {projectTypeLabel(lead)}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {locationLabel(lead)}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <GradeBadge grade={grade} size="md" />
              <span className="text-sm tabular-nums text-muted-foreground">
                {score} / 100
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="whitespace-pre-wrap text-foreground/90">{summary}</p>
            {reason ? (
              <p className="text-xs italic text-muted-foreground">{reason}</p>
            ) : null}
            <p className="rounded-md border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs text-foreground/90">
              Est. job value: {est}
            </p>
            {flags.length > 0 ? (
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
            ) : null}
            {!scoredBy ? (
              <p className="text-xs text-muted-foreground">
                This lead is listed; automated AI scoring was unavailable when
                it was created.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Accept this lead</h2>
          <p className="text-sm text-muted-foreground">
            Pay the flat lead fee to proceed. You&apos;ll be redirected to
            Stripe&apos;s secure checkout.
          </p>
          {lead.paymentStatus === "succeeded" ? (
            <p className="text-sm text-emerald-600">
              This lead is already paid for and secured.
            </p>
          ) : (
            <LeadAcceptPayment
              leadId={leadId}
              exclusiveMatchStatus={lead.matchStatus}
              matchedTradespersonId={lead.matchedTradespersonId}
              onPaymentSucceeded={() => {
                void utils.leads.getById.invalidate({ id: leadId });
              }}
            />
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/leads/${encodeURIComponent(leadId)}`}
            className={cn(buttonVariants({ variant: "secondary" }), "w-full sm:w-auto")}
          >
            Full project page (bids & matches)
          </Link>
        </div>
      </div>
    </div>
  );
}
