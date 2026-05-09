"use client";

import { ShieldCheck, User } from "lucide-react";

import { VerificationBadges } from "@/components/trades/verification-badges";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/react";
import { cn } from "@/lib/utils";

type Props = {
  leadId: string;
  matchedTradespersonId: string;
};

function formatMatchScore(score: number | undefined): string {
  if (score === undefined || Number.isNaN(score)) return "—";
  const n = Number(score);
  const pct = n <= 1 && n > 0 ? Math.round(n * 100) : Math.round(n);
  return `${pct}%`;
}

function statusBadgeClasses(status: string | undefined) {
  const s = (status ?? "").toLowerCase();
  if (s === "fully_verified") {
    return "border-emerald-500/40 bg-emerald-600 text-white hover:bg-emerald-600";
  }
  if (s === "partially_verified") {
    return "border-amber-500/40 bg-amber-500/20 text-amber-100 hover:bg-amber-500/25";
  }
  return "border-white/20 bg-white/10 text-foreground hover:bg-white/15";
}

export function MatchedTradespersonPanel({
  leadId,
  matchedTradespersonId,
}: Props) {
  const q = trpc.leads.getMatched.useQuery(
    { leadId },
    { enabled: Boolean(leadId && matchedTradespersonId.trim()) },
  );

  const trade = q.data?.[0];

  return (
    <Card className="border-emerald-500/20 ring-1 ring-emerald-500/10">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg">Your matched tradesperson</CardTitle>
            <CardDescription>
              Trust signals below reflect checks completed for this profile — not marketing fluff.
            </CardDescription>
          </div>
          {trade ? (
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 gap-1 border font-medium",
                statusBadgeClasses(trade.verificationStatus),
              )}
            >
              <ShieldCheck className="size-4" aria-hidden />
              {trade.verificationStatus === "fully_verified"
                ? "Fully verified"
                : trade.verificationStatus === "partially_verified"
                  ? "Partially verified"
                  : "Checks on profile"}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {q.isLoading ? (
          <Skeleton className="h-28 w-full rounded-md" />
        ) : trade ? (
          <>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="size-8 text-muted-foreground" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-semibold text-foreground">{trade.name}</h3>
                <p className="text-muted-foreground">{trade.trade || "—"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Match score:{" "}
                  <span className="font-medium text-foreground">
                    {formatMatchScore(trade.matchScore)}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-4 dark:bg-emerald-950/20">
              <h4 className="mb-3 flex items-center gap-2 font-medium text-emerald-100">
                <ShieldCheck className="size-4 text-emerald-400" aria-hidden />
                Verification on this profile
              </h4>
              <VerificationBadges badges={trade.verificationBadges} />
              <p className="mt-3 text-xs text-muted-foreground">
                Labels reflect checks completed in our system — if ID or insurance isn&apos;t
                listed, review may still be in progress or documents weren&apos;t submitted.
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load this match. Open your project again or contact{" "}
            <a className="underline" href="mailto:support@tradescore.uk">
              support@tradescore.uk
            </a>
            .
          </p>
        )}
      </CardContent>
    </Card>
  );
}
