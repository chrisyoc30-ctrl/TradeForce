"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

import { trpc } from "@/trpc/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TS_KEY = "tradescore-tradesperson-id";

export default function DeclineLeadPage() {
  const params = useParams();
  const leadId = typeof params.leadId === "string" ? params.leadId : "";
  const utils = trpc.useUtils();
  const [tsId, setTsId] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setTsId((window.localStorage.getItem(TS_KEY) ?? "").trim());
  }, []);

  const mutation = trpc.leads.declineExclusive.useMutation({
    onSuccess: async () => {
      await utils.leads.getById.invalidate({ id: leadId });
      setDone(true);
    },
  });

  if (!leadId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted-foreground">
        Invalid lead link.
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-lg space-y-6">
        <Link
          href={`/leads/${encodeURIComponent(leadId)}/accept`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to lead
        </Link>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">Decline this lead</h1>
          <p className="text-sm text-muted-foreground">
            We&apos;ll offer this job to another local tradesperson. You won&apos;t
            be charged.
          </p>
        </div>

        {done ? (
          <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-foreground">
            You&apos;ve declined this lead. You can close this tab or{" "}
            <Link href="/lead-scoring" className="font-medium underline underline-offset-2">
              return to the board
            </Link>
            .
          </p>
        ) : null}

        {!done && !tsId ? (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
            Save your TradeScore tradesperson ID in your browser (
            <Link href="/available-jobs" className="underline underline-offset-2">
              Available Jobs
            </Link>
            ) before declining — we use it to confirm it&apos;s you.
          </div>
        ) : null}

        {!done && mutation.error ? (
          <p className="text-sm text-destructive" role="alert">
            {mutation.error.message}
          </p>
        ) : null}

        {!done ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:flex-1"
              disabled={!tsId || mutation.isPending}
              onClick={() => void mutation.mutate({ leadId, tradespersonId: tsId })}
            >
              {mutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Working…
                </span>
              ) : (
                "Confirm decline"
              )}
            </Button>
            <Link
              href="/lead-scoring"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full justify-center sm:flex-1"
              )}
            >
              Cancel
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
