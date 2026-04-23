"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Lead } from "@/types/lead";
import { gradeClass, fraudStyles } from "@/lib/grade-styles";
import {
  budgetLabel,
  defaultMatchConfidence,
  projectTypeLabel,
  timelineLabel,
} from "@/components/leads/lead-helpers";
import { LeadAcceptPayment } from "@/components/leads/lead-accept-payment";

type Props = {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmitQuote: (lead: Lead) => void;
  /** After Stripe confirms payment (webhook updates DB shortly after). */
  onLeadPaymentSucceeded?: () => void;
};

export function LeadDetailDialog({
  lead,
  open,
  onOpenChange,
  onSubmitQuote,
  onLeadPaymentSucceeded,
}: Props) {
  if (!lead) return null;
  const g = gradeClass(lead.aiGrade);
  const f = fraudStyles(lead.fraudRisk);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto border-border/80 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 pr-6">
            <span
              className={`inline-flex h-12 min-w-12 items-center justify-center rounded-lg px-3 text-2xl font-bold ${g.badge}`}
            >
              {lead.aiGrade ?? "—"}
            </span>
            <span>{projectTypeLabel(lead)}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-2xl font-semibold text-foreground">
            {(lead.aiScore ?? 0)}/100
          </p>
          <p className="whitespace-pre-wrap text-muted-foreground">
            {String(lead.description ?? "—")}
          </p>
          <div className="grid gap-2 text-muted-foreground">
            <p>
              <span className="text-foreground/80">Budget: </span>
              {budgetLabel(lead)}
            </p>
            <p>
              <span className="text-foreground/80">Timeline: </span>
              {timelineLabel(lead)}
            </p>
            <p>
              <span className="text-foreground/80">Fraud risk: </span>
              <Badge
                variant="outline"
                className={`ml-1 border ${f.className}`}
              >
                {f.label}
              </Badge>
            </p>
            <p>
              <span className="text-foreground/80">Match confidence: </span>
              {defaultMatchConfidence(lead)}%
            </p>
            {lead.paymentStatus === "succeeded" && (
              <p className="text-sm font-medium text-emerald-400/90">
                Payment received — lead accepted
              </p>
            )}
          </div>
        </div>
        {onLeadPaymentSucceeded && lead.paymentStatus !== "succeeded" && (
          <LeadAcceptPayment
            leadId={lead.id}
            onPaymentSucceeded={() => {
              onLeadPaymentSucceeded();
              onOpenChange(false);
            }}
          />
        )}
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" onClick={() => onSubmitQuote(lead)}>
            Submit quote
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
