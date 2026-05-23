"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Info, Loader2, ArrowLeft, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

import { trpc } from "@/trpc/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { postJobOrangeSolidCtaClasses } from "@/lib/cta-tailwind";
import type { DeclineClientErrorPayload } from "@/server/api/routers/leads";

const TS_KEY = "tradescore-tradesperson-id";
const DEFAULT_JOBS_URL = "https://www.tradescore.uk/available-jobs";
const DEFAULT_JOBS_CTA = "View other available leads";
const SUCCESS_SCENARIOS = new Set(["already_exhausted", "token_stale"]);
const WARNING_SCENARIOS = new Set(["trade_mismatch"]);

type DeclineOutcome = {
  scenario: string;
  friendly_message: string;
  cta_url?: string;
  cta_text?: string;
};

function parseDeclineClientError(message: string): DeclineClientErrorPayload | null {
  try {
    const parsed = JSON.parse(message) as DeclineClientErrorPayload;
    if (parsed?.decline && typeof parsed.friendly_message === "string") {
      return parsed;
    }
  } catch {
    /* not a structured decline error */
  }
  return null;
}

function outcomeFromSuccess(data: {
  scenario?: string;
  friendly_message?: string;
  message?: string;
  cta_url?: string;
  cta_text?: string;
  exhausted?: boolean;
}): DeclineOutcome {
  const scenario =
    data.scenario?.trim() ||
    (data.exhausted ? "already_exhausted" : "decline_confirmed");
  const friendly_message =
    (typeof data.friendly_message === "string" && data.friendly_message.trim()) ||
    (typeof data.message === "string" && data.message.trim()) ||
    (data.exhausted
      ? "We've notified the customer that we're finding alternatives."
      : "Lead declined. We're matching another verified trade now.");
  return {
    scenario,
    friendly_message,
    cta_url: data.cta_url?.trim() || DEFAULT_JOBS_URL,
    cta_text: data.cta_text?.trim() || DEFAULT_JOBS_CTA,
  };
}

function DeclineOutcomeCard({
  outcome,
  tone,
}: {
  outcome: DeclineOutcome;
  tone: "success" | "info" | "warning";
}) {
  const Icon =
    tone === "success"
      ? CheckCircle2
      : tone === "warning"
        ? AlertTriangle
        : Info;
  const toneClasses =
    tone === "success"
      ? "border-emerald-500/40 bg-emerald-50 text-emerald-950"
      : tone === "warning"
        ? "border-red-500/40 bg-red-50 text-red-950"
        : "border-amber-500/40 bg-[#fef3c7] text-[#92400e]";

  const iconClasses =
    tone === "success"
      ? "text-emerald-600"
      : tone === "warning"
        ? "text-red-600"
        : "text-amber-700";

  const ctaUrl = outcome.cta_url || DEFAULT_JOBS_URL;
  const ctaText = outcome.cta_text || DEFAULT_JOBS_CTA;
  const showJobsCta = outcome.scenario !== "already_accepted";

  return (
    <div className={cn("space-y-4 rounded-lg border px-4 py-5", toneClasses)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", iconClasses)} aria-hidden />
        <p className="text-sm font-medium leading-relaxed">{outcome.friendly_message}</p>
      </div>
      {showJobsCta ? (
        <Link href={ctaUrl} className={cn(postJobOrangeSolidCtaClasses, "w-full sm:w-auto")}>
          {ctaText}
        </Link>
      ) : null}
      <p className="text-xs opacity-80">
        Need help?{" "}
        <a
          href="mailto:support@tradescore.uk"
          className="font-medium underline underline-offset-2"
        >
          Contact support@tradescore.uk
        </a>
      </p>
    </div>
  );
}

function toneForScenario(scenario: string): "success" | "info" | "warning" {
  if (SUCCESS_SCENARIOS.has(scenario)) return "success";
  if (WARNING_SCENARIOS.has(scenario)) return "warning";
  return "info";
}

export default function DeclineLeadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const leadId = typeof params.leadId === "string" ? params.leadId : "";
  const token = (searchParams.get("token") ?? "").trim();
  const utils = trpc.useUtils();
  const [tsId, setTsId] = useState("");
  const [outcome, setOutcome] = useState<DeclineOutcome | null>(null);
  const [outcomeTone, setOutcomeTone] = useState<"success" | "info" | "warning">("info");

  useEffect(() => {
    setTsId((window.localStorage.getItem(TS_KEY) ?? "").trim());
  }, []);

  const mutation = trpc.leads.declineExclusive.useMutation({
    onSuccess: async (data) => {
      await utils.leads.getById.invalidate();
      const resolved = outcomeFromSuccess(data);
      setOutcome(resolved);
      if (SUCCESS_SCENARIOS.has(resolved.scenario)) {
        setOutcomeTone(toneForScenario(resolved.scenario));
      } else {
        setOutcomeTone("success");
      }
    },
    onError: (error) => {
      const parsed = parseDeclineClientError(error.message);
      if (parsed) {
        setOutcome({
          scenario: parsed.scenario,
          friendly_message: parsed.friendly_message,
          cta_url: parsed.cta_url,
          cta_text: parsed.cta_text,
        });
        setOutcomeTone(toneForScenario(parsed.scenario));
        return;
      }
      setOutcome({
        scenario: "unknown",
        friendly_message: error.message || "Something went wrong. Please try again.",
        cta_url: DEFAULT_JOBS_URL,
        cta_text: DEFAULT_JOBS_CTA,
      });
      setOutcomeTone("info");
    },
  });

  const canSubmit = Boolean(token) || Boolean(tsId);
  const finished = Boolean(outcome);

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

        {finished && outcome ? (
          <DeclineOutcomeCard outcome={outcome} tone={outcomeTone} />
        ) : null}

        {!finished && !token && !tsId ? (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
            Open this page from the link in your match email, or save your
            TradeScore ID under{" "}
            <Link href="/available-jobs" className="underline underline-offset-2">
              Available Jobs
            </Link>{" "}
            first.
          </div>
        ) : null}

        {!finished ? (
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
