"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/trpc/react";
import { TRADESMAN_LEAD_PRICE_GBP } from "@/lib/pricing";

const NAME_KEY = "tradescore-tradesman-name";
const EMAIL_KEY = "tradescore-tradesman-email";
const TS_ID_KEY = "tradescore-tradesperson-id";

const DEFAULT_PAYMENT_LINK =
  "https://buy.stripe.com/test_cNi6oHfFBeXB4Gra0e4ZG01";

type Props = {
  leadId: string;
  onPaymentSucceeded: () => void;
  /** When reserved, Flask exclusive accept runs before opening checkout. */
  exclusiveMatchStatus?: string | null;
  matchedTradespersonId?: string | null;
};

export function LeadAcceptPayment({
  leadId,
  onPaymentSucceeded,
  exclusiveMatchStatus,
  matchedTradespersonId,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [tradesmanName, setTradesmanName] = useState("");
  const [tradesmanEmail, setTradesmanEmail] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setTradesmanName(
      (window.localStorage.getItem(NAME_KEY) ?? "").trim() || ""
    );
    setTradesmanEmail(
      (window.localStorage.getItem(EMAIL_KEY) ?? "").trim() || ""
    );
  }, []);

  function persistIdentity(name: string, email: string) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(NAME_KEY, name);
      window.localStorage.setItem(EMAIL_KEY, email);
    }
  }

  const confirmExclusive = trpc.leads.confirmExclusiveAccept.useMutation();

  const handleAcceptLead = async () => {
    const name = tradesmanName.trim();
    const email = tradesmanEmail.trim();
    if (!name || !email) return;

    const reserve =
      (exclusiveMatchStatus ?? "").trim().toLowerCase() === "reserved";
    const expectId =
      typeof matchedTradespersonId === "string"
        ? matchedTradespersonId.trim()
        : "";
    const tsId =
      typeof window !== "undefined"
        ? (window.localStorage.getItem(TS_ID_KEY) ?? "").trim()
        : "";
    if (reserve && expectId && (!tsId || tsId !== expectId)) {
      alert(
        "This lead was assigned exclusively using a tradesperson ID. Open this link on the device where you saved your TradeScore ID, or paste your ID under Available Jobs first."
      );
      return;
    }

    setBusy(true);
    try {
      if (reserve && expectId && tsId) {
        await confirmExclusive.mutateAsync({
          leadId,
          tradespersonId: tsId,
        });
      }
      persistIdentity(name, email);
      try {
        await fetch(`/api/leads/${encodeURIComponent(leadId)}/mark-pending`, {
          method: "POST",
        });
      } catch {
        /* best-effort */
      }
      const paymentLink =
        process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? DEFAULT_PAYMENT_LINK;
      const url = new URL(paymentLink);
      url.searchParams.set("client_reference_id", leadId);
      window.location.assign(url.toString());
      onPaymentSucceeded();
    } catch (err) {
      console.error("Accept lead failed:", err);
      setBusy(false);
    }
  };

  const canContinue =
    tradesmanName.trim().length > 0 && tradesmanEmail.trim().length > 0;

  return (
    <div className="space-y-2 rounded-lg border border-border/80 bg-muted/15 p-3">
      <p className="text-sm font-medium text-foreground">
        Accept this lead (£{TRADESMAN_LEAD_PRICE_GBP} flat fee)
      </p>
      <p className="text-xs text-muted-foreground">
        You&apos;ll complete payment on Stripe&apos;s secure checkout. No
        commission — one flat fee per accepted lead.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2 sm:max-w-sm">
          <Label htmlFor="tm-pay-name">Your name (shown to homeowner)</Label>
          <Input
            id="tm-pay-name"
            value={tradesmanName}
            onChange={(e) => setTradesmanName(e.target.value)}
            autoComplete="name"
            placeholder="e.g. Jamie McAllister"
          />
        </div>
        <div className="grid gap-2 sm:col-span-2 sm:max-w-sm">
          <Label htmlFor="tm-pay-email">Email (for your receipt)</Label>
          <Input
            id="tm-pay-email"
            type="email"
            inputMode="email"
            value={tradesmanEmail}
            onChange={(e) => setTradesmanEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
      </div>
      {confirmExclusive.error ? (
        <p className="text-sm text-destructive">
          {confirmExclusive.error.message}
        </p>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        disabled={busy || confirmExclusive.isPending || !canContinue}
        onClick={() => void handleAcceptLead()}
      >
        {busy || confirmExclusive.isPending
          ? "Preparing checkout…"
          : `Accept this lead — £${TRADESMAN_LEAD_PRICE_GBP}`}
      </Button>
    </div>
  );
}
