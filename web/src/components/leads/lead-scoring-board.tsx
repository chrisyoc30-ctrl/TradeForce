"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/trpc/react";
import type { Lead } from "@/types/lead";
import { parseBudgetNumber, urgencyScore } from "@/components/leads/lead-helpers";
import { LeadCard } from "@/components/leads/lead-card";
import { NotifyMeInline } from "@/components/leads/notify-me-inline";
import { pricingCopy } from "@/lib/pricing";

type GradeFilter = "all" | "A" | "B" | "C";
type SortKey = "score" | "budget" | "urgency";

function sortLeads(list: Lead[], key: SortKey): Lead[] {
  const next = [...list];
  if (key === "score") {
    next.sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0));
  } else if (key === "budget") {
    next.sort(
      (a, b) =>
        parseBudgetNumber(b) - parseBudgetNumber(a) ||
        (b.aiScore ?? 0) - (a.aiScore ?? 0)
    );
  } else {
    next.sort(
      (a, b) =>
        urgencyScore(b) - urgencyScore(a) ||
        (b.aiScore ?? 0) - (a.aiScore ?? 0)
    );
  }
  return next;
}

function normalizeGrade(grade: string | undefined): string {
  return (grade ?? "").toUpperCase();
}

export function LeadScoringBoard() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    trpc.leads.getUnmatched.useQuery(undefined, {
      refetchInterval: 10_000,
    });
  const [grade, setGrade] = useState<GradeFilter>("all");
  const [sort, setSort] = useState<SortKey>("score");

  const leads = useMemo(() => {
    const list = (data ?? []) as Lead[];
    const filtered =
      grade === "all"
        ? list
        : list.filter((l) => normalizeGrade(l.aiGrade) === grade);
    return sortLeads(filtered, sort);
  }, [data, grade, sort]);

  return (
    <div className="min-h-dvh bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Available High-Priority Leads
            </h1>
            <p className="text-sm text-muted-foreground">
              Sorted by quality score (highest first)
            </p>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              {pricingCopy.trades.headline}. No commission — flat fee only.{" "}
              <Link
                href="/pricing"
                className="font-medium text-foreground/90 underline underline-offset-2 hover:text-foreground"
              >
                View pricing
              </Link>
            </p>
            {isFetching && !isLoading && (
              <p className="pt-1 text-xs text-amber-400/80">Refreshing…</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              Filter
            </span>
            {(
              [
                ["all", "All Leads"],
                ["A", "Grade A"],
                ["B", "Grade B"],
                ["C", "Grade C"],
              ] as const
            ).map(([v, label]) => (
              <Button
                key={v}
                type="button"
                size="sm"
                variant={grade === v ? "default" : "secondary"}
                onClick={() => setGrade(v)}
                className="h-8"
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="flex w-full max-w-xs flex-col gap-1.5 sm:w-72">
            <span className="text-xs text-muted-foreground">Sort by</span>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Quality score (high to low)</SelectItem>
                <SelectItem value="budget">Budget (high to low)</SelectItem>
                <SelectItem value="urgency">Urgency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isError && (
          <p className="text-sm text-destructive">
            {error?.message}
            <Button variant="link" className="pl-1" onClick={() => void refetch()}>
              Retry
            </Button>
          </p>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-border/60">
                <CardHeader>
                  <Skeleton className="h-14 w-14 rounded-lg" />
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && leads.length === 0 && !isError && (
          <div className="space-y-6">
            <div className="rounded-lg border border-dashed border-border/80 bg-muted/10 px-6 py-10">
              <h2 className="text-lg font-semibold text-foreground">
                No leads in your area yet
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                We&apos;re onboarding tradespeople across Glasgow now. Drop your
                details and we&apos;ll notify you the moment a matching lead
                comes in.
              </p>
            </div>
            <NotifyMeInline />
          </div>
        )}

        {!isLoading && leads.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {leads.map((lead) => (
              <LeadCard key={String(lead.id)} lead={lead} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
