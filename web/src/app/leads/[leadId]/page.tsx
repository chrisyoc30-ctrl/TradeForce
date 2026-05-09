"use client";

import { useEffect, useState } from "react";
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
  isTradeLeadContactUnlocked,
  locationLabel,
  projectTypeLabel,
  timelineLabel,
  tradesLeadLocationPreview,
} from "@/components/leads/lead-helpers";
import { LeadAcceptPayment } from "@/components/leads/lead-accept-payment";
import { MatchedTradespersonPanel } from "@/components/leads/matched-tradesperson-panel";
import { cn } from "@/lib/utils";
import { readHomeownerSessionPhone } from "@/lib/auth-nav";

const TS_STORAGE = "tradescore-tradesperson-id";

function paymentClearedStatuses(lead: { paymentStatus?: string | null }): boolean {
  const ps = (lead.paymentStatus ?? "").toLowerCase();
  return ["succeeded", "paid", "free_first", "unlimited_tier"].includes(ps);
}

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = typeof params.leadId === "string" ? params.leadId : "";

  const utils = trpc.useUtils();
  const [viewerTradespersonId, setViewerTradespersonId] = useState("");
  const [homeownerPhone, setHomeownerPhone] = useState("");

  useEffect(() => {
    setViewerTradespersonId((window.localStorage.getItem(TS_STORAGE) ?? "").trim());
    setHomeownerPhone(readHomeownerSessionPhone().trim());
  }, []);

  const getByIdInput = {
    id: leadId,
    viewerTradespersonId: viewerTradespersonId.trim() || undefined,
    homeownerPhone:
      homeownerPhone.trim().length >= 8 ? homeownerPhone.trim() : undefined,
  };

  const { data: lead, isLoading: leadLoading } = trpc.leads.getById.useQuery(
    getByIdInput,
    { enabled: Boolean(leadId) },
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
  const unlocked = isTradeLeadContactUnlocked(lead);

  const hasTradeViewerId = viewerTradespersonId.trim().length > 0;
  const matched = String(lead.matchedTradespersonId ?? "").trim();
  const isMatchedTradeViewer =
    hasTradeViewerId && matched !== "" && matched === viewerTradespersonId.trim();

  const paymentCleared = paymentClearedStatuses(lead);
  const showMatchedTradeCheckout = isMatchedTradeViewer && !paymentCleared;

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
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="text-foreground/80">Location: </span>
              {unlocked ? locationLabel(lead) : tradesLeadLocationPreview(lead)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex h-14 min-w-14 items-center justify-center rounded-lg px-3 text-2xl font-bold",
                g.badge,
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

        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm font-medium">Contact &amp; posting details</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {unlocked ? (
              <div className="space-y-1.5 text-foreground/90">
                {(lead.name ?? "").trim() ? (
                  <p>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    {lead.name!.trim()}
                  </p>
                ) : (
                  <p className="text-muted-foreground">Name not recorded.</p>
                )}
                {(lead.phone ?? "").trim() ? (
                  <p>
                    <span className="text-muted-foreground">Phone:</span>{" "}
                    <a
                      href={`tel:${lead.phone!.replace(/\s/g, "")}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {lead.phone}
                    </a>
                  </p>
                ) : null}
                {(lead.email ?? "").trim() ? (
                  <p className="break-all">
                    <span className="text-muted-foreground">Email:</span>{" "}
                    <a
                      href={`mailto:${encodeURIComponent(lead.email!.trim())}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {lead.email}
                    </a>
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="rounded-md border border-amber-500/35 bg-muted/35 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                {hasTradeViewerId && !isMatchedTradeViewer ? (
                  <>
                    This page does not reveal homeowner contact unless you&apos;re the
                    matched tradesperson who accepted and paid. Open this lead from the
                    Available Jobs board, or confirm your TS ID matches the exclusive
                    offer.
                  </>
                ) : homeownerPhone.trim().length < 8 ? (
                  <>
                    For your privacy, postcode area only{" "}
                    <strong className="text-foreground">
                      ({tradesLeadLocationPreview(lead)})
                    </strong>{" "}
                    is shown here unless you verified with the phone number you used when
                    you posted (&quot;View your dashboard&quot; or submit a job in this
                    browser first).
                  </>
                ) : (
                  <>
                    We couldn&apos;t match this browser session to unlock your contacts.
                    Open{" "}
                    <Link
                      href="/homeowner-dashboard"
                      className="font-medium text-foreground underline underline-offset-2"
                    >
                      homeowner dashboard
                    </Link>{" "}
                    with the same phone you used on the form, then return to this page.
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {matched !== "" && (unlocked || isMatchedTradeViewer) ? (
          <MatchedTradespersonPanel
            leadId={leadId}
            matchedTradespersonId={matched}
          />
        ) : null}

        {showMatchedTradeCheckout ? (
          <section className="space-y-2 border-t border-border/80 pt-8">
            <h2 className="text-lg font-semibold">Accept this lead</h2>
            <p className="text-sm text-muted-foreground">
              Review the project above, then pay the lead fee to unlock full contact
              details.
            </p>
            <LeadAcceptPayment
              leadId={leadId}
              exclusiveMatchStatus={lead.matchStatus}
              matchedTradespersonId={lead.matchedTradespersonId}
              onPaymentSucceeded={() => {
                void utils.leads.getById.invalidate();
              }}
            />
          </section>
        ) : null}

        {isMatchedTradeViewer && paymentCleared ? (
          <p className="text-sm text-emerald-600">
            This lead is paid for and secured — full contact details are visible above.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Link
            href="/homeowner-dashboard"
            className={cn(buttonVariants({ variant: "secondary" }))}
          >
            Homeowner dashboard
          </Link>
          <Link
            href="/lead-scoring"
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            Browse leads (trades)
          </Link>
        </div>
      </div>
    </div>
  );
}
