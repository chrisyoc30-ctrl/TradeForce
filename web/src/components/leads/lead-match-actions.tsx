"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { trpc } from "@/trpc/react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { postJobOrangeSolidCtaClasses } from "@/lib/cta-tailwind";
import { TRADESMAN_LEAD_PRICE_GBP } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type Props = {
  leadId: string;
  tradespersonId: string;
  accessToken?: string;
  declineToken?: string | null;
  canUseFree?: boolean;
};

export function LeadMatchActions({
  leadId,
  tradespersonId,
  accessToken,
  declineToken,
  canUseFree = false,
}: Props) {
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineOutcome, setDeclineOutcome] = useState<string | null>(null);
  const declineMutation = trpc.leads.declineExclusive.useMutation();

  const acceptQs = new URLSearchParams();
  acceptQs.set("trade", tradespersonId);
  if (accessToken?.trim()) {
    acceptQs.set("token", accessToken.trim());
  }
  const acceptHref = `/leads/${encodeURIComponent(leadId)}/accept?${acceptQs.toString()}`;

  const acceptLabel = canUseFree
    ? "Accept (FREE — your first lead)"
    : `Accept (£${TRADESMAN_LEAD_PRICE_GBP})`;

  const handleDecline = async () => {
    setDeclineOutcome(null);
    try {
      const data = await declineMutation.mutateAsync({
        leadId,
        token: declineToken?.trim() || undefined,
        tradespersonId: declineToken?.trim() ? undefined : tradespersonId,
      });
      setDeclineOpen(false);
      setDeclineOutcome(
        data.friendly_message ||
          data.message ||
          "Lead passed — we'll match another verified trade.",
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not decline this lead.";
      setDeclineOutcome(message);
      setDeclineOpen(false);
    }
  };

  return (
    <section className="space-y-3 border-t border-border/80 pt-8">
      <h2 className="text-lg font-semibold">Your exclusive match</h2>
      <p className="text-sm text-muted-foreground">
        Review the project above, then accept to unlock full homeowner contact
        details.
      </p>

      {declineOutcome ? (
        <p className="rounded-md border border-border/80 bg-muted/30 px-3 py-2 text-sm text-foreground/90">
          {declineOutcome}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Link
          href={acceptHref}
          className={cn(
            postJobOrangeSolidCtaClasses,
            "w-full justify-center text-center sm:w-auto",
          )}
        >
          {acceptLabel}
        </Link>
        <Button
          type="button"
          variant="ghost"
          className="w-full text-muted-foreground sm:w-auto"
          onClick={() => setDeclineOpen(true)}
        >
          Pass on this lead
        </Button>
      </div>

      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent showCloseButton className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pass on this lead?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure? This lead will be passed to another trade.
          </p>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={declineMutation.isPending}
              onClick={() => setDeclineOpen(false)}
            >
              Keep lead
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={declineMutation.isPending}
              onClick={() => void handleDecline()}
            >
              {declineMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Passing…
                </>
              ) : (
                "Yes, pass to next trade"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
