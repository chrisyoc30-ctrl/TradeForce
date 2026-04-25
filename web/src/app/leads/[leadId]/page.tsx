"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { trpc } from "@/trpc/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { gradeClass, fraudStyles } from "@/lib/grade-styles";
import {
  budgetLabel,
  projectTypeLabel,
  timelineLabel,
} from "@/components/leads/lead-helpers";
import { BidForm } from "@/components/BidForm";
import { LeadAcceptPayment } from "@/components/leads/lead-accept-payment";
import { cn } from "@/lib/utils";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = typeof params.leadId === "string" ? params.leadId : "";

  const utils = trpc.useUtils();
  const { data: lead, isLoading: leadLoading } = trpc.leads.getById.useQuery(
    { id: leadId },
    { enabled: Boolean(leadId) }
  );
  const { data: matched = [], isLoading: matchedLoading } =
    trpc.leads.getMatched.useQuery(
      { leadId },
      { enabled: Boolean(leadId) }
    );
  const { data: bids = [], isLoading: bidsLoading } =
    trpc.bids.getForLead.useQuery(
      { leadId },
      {
        enabled: Boolean(leadId),
        refetchInterval: 5000,
      }
    );

  const acceptBid = trpc.bids.accept.useMutation({
    onSuccess: () => {
      void utils.bids.getForLead.invalidate({ leadId });
      void utils.leads.getById.invalidate({ id: leadId });
    },
  });

  if (!leadId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted-foreground">
        Invalid lead link.
      </div>
    );
  }

  if (leadLoading || !lead) {
    return (
      <div className="flex min-h-dvh items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading project…
      </div>
    );
  }

  const g = gradeClass(lead.aiGrade);
  const f = fraudStyles(lead.fraudRisk);

  return (
    <div className="min-h-dvh bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/lead-capture"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ← Post another job
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              {projectTypeLabel(lead)}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Lead ID <span className="font-mono text-foreground/80">{leadId}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex h-14 min-w-14 items-center justify-center rounded-lg px-3 text-2xl font-bold",
                g.badge
              )}
            >
              {lead.aiGrade ?? "—"}
            </span>
            <div className="text-sm">
              <p className="text-2xl font-semibold">{lead.aiScore ?? 0}/100</p>
              <p className="text-muted-foreground">AI priority score</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm font-medium">Project</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="whitespace-pre-wrap text-muted-foreground">
              {String(lead.description ?? "—")}
            </p>
            <div className="grid gap-1 text-muted-foreground">
              <p>
                <span className="text-foreground/80">Budget: </span>
                {budgetLabel(lead)}
              </p>
              <p>
                <span className="text-foreground/80">Timeline: </span>
                {timelineLabel(lead)}
              </p>
              <p className="flex flex-wrap items-center gap-2">
                <span className="text-foreground/80">Fraud risk: </span>
                <Badge variant="outline" className={cn("border", f.className)}>
                  {f.label}
                </Badge>
              </p>
            </div>
          </CardContent>
        </Card>

        <section className="border-t border-border/80 pt-8">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">Submit your bid</h2>
          <BidForm
            leadId={lead.id}
            leadBudget={lead.budget}
            onSuccess={() => {
              void utils.bids.getForLead.invalidate({ leadId });
              void utils.leads.getById.invalidate({ id: leadId });
              router.refresh();
            }}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Matched tradespeople</h2>
          {matchedLoading ? (
            <p className="text-sm text-muted-foreground">Loading matches…</p>
          ) : matched.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches yet.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {matched.map((t) => (
                <Card key={t.id}>
                  <CardContent className="space-y-1 p-4 text-sm">
                    <p className="font-medium">{t.name}</p>
                    <p className="text-muted-foreground">{t.trade}</p>
                    <p className="text-foreground/90">
                      Match score:{" "}
                      <span className="font-semibold">{t.matchScore}%</span>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Bids</h2>
          {bidsLoading ? (
            <p className="text-sm text-muted-foreground">Loading bids…</p>
          ) : bids.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No bids yet. Trades can bid from{" "}
              <Link href="/available-jobs" className="underline">
                Available jobs
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-3">
              {bids.map((b) => (
                <Card key={b.id}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm">
                      <p className="font-medium">
                        {b.tradesman?.name ?? b.tradesmanName ?? "Tradesperson"}
                      </p>
                      <p className="text-muted-foreground">{b.description}</p>
                      <p className="pt-1 text-lg font-semibold text-foreground">
                        £{Number(b.amount).toLocaleString("en-GB")}
                      </p>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {b.status}
                      </Badge>
                    </div>
                    {b.status === "pending" && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={acceptBid.isPending}
                        onClick={() => acceptBid.mutate({ bidId: b.id })}
                      >
                        Accept bid
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </ul>
          )}
          {acceptBid.error && (
            <p className="text-sm text-destructive">{acceptBid.error.message}</p>
          )}
        </section>

        {lead.paymentStatus !== "succeeded" && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Secure this lead (trade)</h2>
            <p className="text-sm text-muted-foreground">
              Flat fee to accept the lead after you win the job — same flow as the
              lead board.
            </p>
            <LeadAcceptPayment
              leadId={leadId}
              onPaymentSucceeded={() => {
                void utils.leads.getById.invalidate({ id: leadId });
              }}
            />
          </section>
        )}

        <div className="flex flex-wrap gap-2">
          <Link href="/homeowner-dashboard" className={cn(buttonVariants({ variant: "secondary" }))}>
            Homeowner dashboard
          </Link>
          <Link href="/lead-scoring" className={cn(buttonVariants({ variant: "ghost" }))}>
            Browse leads (trades)
          </Link>
        </div>
      </div>
    </div>
  );
}
