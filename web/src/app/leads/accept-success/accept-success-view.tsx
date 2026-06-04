"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { trpc } from "@/trpc/react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { isTradeLeadContactUnlocked } from "@/components/leads/lead-helpers";
import { cn } from "@/lib/utils";
import {
  persistTradespersonIdFromUrl,
  resolveViewerTradespersonId,
  TRADESPERSON_ID_STORAGE_KEY,
} from "@/lib/tradesperson-storage";
import type { Lead } from "@/types/lead";

function maskTradeEmail(email: string): string {
  const e = email.trim();
  if (!e.includes("@")) {
    return e || "your email";
  }
  const [local, domain] = e.split("@", 2);
  const maskedLocal = local.length > 0 ? `${local[0]}***` : "***";
  return `${maskedLocal}@${domain}`;
}

function leadConfirmationEmailSent(lead: Lead): boolean {
  const raw = lead as Lead & { trade_payment_confirmation_sent?: boolean };
  return Boolean(raw.trade_payment_confirmation_sent);
}

function buildLeadDetailHref(
  leadId: string,
  trade: string,
  token: string,
): string {
  const qp = new URLSearchParams();
  if (trade) {
    qp.set("trade", trade);
  }
  if (token) {
    qp.set("token", token);
  }
  const q = qp.toString();
  return `/leads/${encodeURIComponent(leadId)}${q ? `?${q}` : ""}`;
}

export default function AcceptSuccessView() {
  const searchParams = useSearchParams();
  const leadId = (searchParams.get("leadId") ?? "").trim();
  const isFree = searchParams.get("free") === "true";
  const isUnlimited = searchParams.get("unlimited") === "true";
  const urlTrade = (searchParams.get("trade") ?? "").trim();
  const urlToken = (searchParams.get("token") ?? "").trim();
  const hasUrlToken = urlTrade.length > 0 && urlToken.length > 0;

  const [storedTradeId, setStoredTradeId] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setStoredTradeId(
      (window.localStorage.getItem(TRADESPERSON_ID_STORAGE_KEY) ?? "").trim(),
    );
    if (urlTrade) {
      persistTradespersonIdFromUrl(urlTrade);
    }
  }, [urlTrade]);

  const tokenValidation = trpc.leads.validateAccessToken.useQuery(
    {
      leadId,
      tradeId: urlTrade,
      token: urlToken,
      page: "accept",
    },
    { enabled: Boolean(leadId) && hasUrlToken, retry: false },
  );

  const tokenValid = tokenValidation.data?.valid === true;
  const tokenMeta = tokenValidation.data?.valid ? tokenValidation.data : null;
  const waitingOnToken = hasUrlToken && tokenValidation.isLoading;

  const effectiveViewerId = resolveViewerTradespersonId({
    tokenValid,
    tokenTradespersonId: tokenMeta?.tradespersonId,
    urlTrade,
    storedTradeId,
  });

  const { data: lead, isLoading: leadLoading } = trpc.leads.getById.useQuery(
    {
      id: leadId,
      viewerTradespersonId: effectiveViewerId || undefined,
    },
    { enabled: Boolean(leadId) && !waitingOnToken },
  );

  const tradeEmailForMask = useMemo(() => {
    if (tokenMeta?.email?.trim()) {
      return tokenMeta.email.trim();
    }
    if (typeof window !== "undefined") {
      return (
        window.localStorage.getItem("tradescore-tradesman-email") ?? ""
      ).trim();
    }
    return "";
  }, [tokenMeta?.email]);

  const headline = isFree
    ? "Free First Lead Accepted"
    : isUnlimited
      ? "Lead accepted — included in your subscription"
      : "Payment Successful";

  const bodyIntro = isFree
    ? "No payment taken — this is your free first lead on TradeScore."
    : isUnlimited
      ? "No per-lead charge — this acceptance is included in your TradeScore Unlimited plan."
      : "£25 charged to your card. Lead secured to you.";

  const detailHref =
    leadId && (urlTrade || effectiveViewerId)
      ? buildLeadDetailHref(leadId, urlTrade || effectiveViewerId, urlToken)
      : leadId
        ? `/leads/${encodeURIComponent(leadId)}`
        : "/lead-scoring";

  const showConfirmationEmailLine =
    lead != null && leadConfirmationEmailSent(lead);
  const unlocked = lead ? isTradeLeadContactUnlocked(lead) : false;

  if (!leadId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-sm text-muted-foreground">
        Missing lead reference.{" "}
        <Link href="/lead-scoring" className="underline">
          Back to available leads
        </Link>
      </div>
    );
  }

  if (waitingOnToken || leadLoading || !lead) {
    return (
      <div className="flex min-h-dvh items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading your lead…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 text-foreground">
      <h1 className="text-2xl font-semibold tracking-tight">{headline}</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {bodyIntro}
      </p>

      {unlocked ? (
        <Card className="mt-6 border-emerald-500/35">
          <CardHeader className="pb-2">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              Customer contact
            </p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(lead.name ?? "").trim() ? (
              <p>
                <span className="text-muted-foreground">Name:</span>{" "}
                {lead.name!.trim()}
              </p>
            ) : null}
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
            {(lead.postcode ?? lead.location ?? "").toString().trim() ? (
              <p>
                <span className="text-muted-foreground">Postcode:</span>{" "}
                {(lead.postcode ?? lead.location ?? "").toString().trim()}
              </p>
            ) : null}
            {(lead.description ?? "").trim() ? (
              <div className="pt-2">
                <p className="text-muted-foreground">Job description:</p>
                <p className="mt-1 whitespace-pre-wrap text-foreground/90">
                  {String(lead.description).trim()}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <p className="mt-6 rounded-md border border-amber-500/35 bg-muted/35 px-3 py-2 text-sm text-muted-foreground">
          Customer contact could not be loaded here. Open your lead page below
          or check your confirmation email.
        </p>
      )}

      <Link
        href={detailHref}
        className={cn(
          buttonVariants(),
          "mt-6 inline-flex w-full justify-center bg-orange-500 hover:bg-orange-600 sm:w-auto",
        )}
      >
        View lead page
      </Link>

      {showConfirmationEmailLine && tradeEmailForMask ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Confirmation email also sent to your inbox at{" "}
          <span className="font-medium text-foreground">
            {maskTradeEmail(tradeEmailForMask)}
          </span>
          .
        </p>
      ) : null}

      <Link
        href="/lead-scoring"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "mt-6 inline-flex text-sm",
        )}
      >
        Back to available leads
      </Link>
    </div>
  );
}
