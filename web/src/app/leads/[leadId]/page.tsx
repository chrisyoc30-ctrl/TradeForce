"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { trpc } from "@/trpc/react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { gradeClass, fraudStyles } from "@/lib/grade-styles";
import {
  budgetLabel,
  projectTypeLabel,
  timelineLabel,
} from "@/components/leads/lead-helpers";
import { LeadAcceptPayment } from "@/components/leads/lead-accept-payment";
import { cn } from "@/lib/utils";

function leadSecured(lead: { paymentStatus?: string | null }): boolean {
  const ps = (lead.paymentStatus ?? "").toLowerCase();
  return ps === "succeeded" || ps === "free_first";
}

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = typeof params.leadId === "string" ? params.leadId : "";

  const utils = trpc.useUtils();
  const { data: lead, isLoading: leadLoading } = trpc.leads.getById.useQuery(
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

        {!leadSecured(lead) ? (
          <section className="space-y-2 border-t border-border/80 pt-8">
            <h2 className="text-lg font-semibold">Accept this lead</h2>
            <p className="text-sm text-muted-foreground">
              Review the project above, then accept to unlock contact details.
            </p>
            <LeadAcceptPayment
              leadId={leadId}
              exclusiveMatchStatus={lead.matchStatus}
              matchedTradespersonId={lead.matchedTradespersonId}
              onPaymentSucceeded={() => {
                void utils.leads.getById.invalidate({ id: leadId });
              }}
            />
          </section>
        ) : (
          <p className="text-sm text-emerald-600">
            This lead is already secured.
          </p>
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
