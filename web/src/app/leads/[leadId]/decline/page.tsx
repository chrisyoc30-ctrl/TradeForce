"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

import { trpc } from "@/trpc/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TS_KEY = "tradescore-tradesperson-id";

export default function DeclineLeadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const leadId = typeof params.leadId === "string" ? params.leadId : "";
  const token = (searchParams.get("token") ?? "").trim();
  const utils = trpc.useUtils();
  const [tsId, setTsId] = useState("");
  const [done, setDone] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  useEffect(() => {
    setTsId((window.localStorage.getItem(TS_KEY) ?? "").trim());
  }, []);

  const mutation = trpc.leads.declineExclusive.useMutation({
    onSuccess: async (data) => {
      await utils.leads.getById.invalidate();
      setDone(true);
      setResultMessage(
        typeof data.message === "string" && data.message.trim()
          ? data.message.trim()
          : data.exhausted
            ? "We've notified the customer that we're finding alternatives."
            : "Lead declined. We're matching another verified trade now.",
      );
    },
  });

  const canSubmit = Boolean(token) || Boolean(tsId);

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
            be charged, and there&apos;s no penalty for passing on jobs that
            aren&apos;t right for you.
          </p>
        </div>

        {done ? (
          <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-foreground">
            {resultMessage ?? "You've declined this lead."}{" "}
            <Link
              href="/lead-scoring"
              className="font-medium underline underline-offset-2"
            >
              Return to the board
            </Link>
            .
          </p>
        ) : null}

        {!done && !token && !tsId ? (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
            Open this page from the link in your match email, or save your
            TradeScore ID under{" "}
            <Link href="/available-jobs" className="underline underline-offset-2">
              Available Jobs
            </Link>{" "}
            first.
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
              disabled={!canSubmit || mutation.isPending}
              onClick={() =>
                void mutation.mutate({
                  leadId,
                  token: token || undefined,
                  tradespersonId: tsId || undefined,
                })
              }
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
              href={`/leads/${encodeURIComponent(leadId)}/accept`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full justify-center sm:flex-1",
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
