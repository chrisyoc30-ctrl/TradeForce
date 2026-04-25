"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/trpc/react";
import { TRADESMAN_LEAD_PRICE_GBP } from "@/lib/pricing";

const NAME_KEY = "tradescore-tradesman-name";
const EMAIL_KEY = "tradescore-tradesman-email";

type PayInnerProps = {
  onSucceeded: () => void;
};

function PayWithElement({ onSucceeded }: PayInnerProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleConfirm() {
    if (!stripe || !elements) return;
    setBusy(true);
    setErr(null);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/lead-scoring?payment=success`,
      },
      redirect: "if_required",
    });
    setBusy(false);
    if (error) {
      setErr(error.message ?? "Payment failed");
      return;
    }
    onSucceeded();
  }

  return (
    <div className="space-y-3">
      <PaymentElement />
      {err ? (
        <p className="text-sm text-destructive" role="alert">
          {err}
        </p>
      ) : null}
      <Button
        type="button"
        className="w-full"
        disabled={!stripe || busy}
        onClick={handleConfirm}
      >
        {busy ? "Processing…" : `Pay £${TRADESMAN_LEAD_PRICE_GBP} & accept lead`}
      </Button>
      <p className="text-xs text-muted-foreground">
        Test mode: use card <span className="font-mono">4242 4242 4242 4242</span>,
        any future expiry, any CVC.
      </p>
    </div>
  );
}

type Props = {
  leadId: string;
  onPaymentSucceeded: () => void;
};

export function LeadAcceptPayment({ leadId, onPaymentSucceeded }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
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

  const createIntent = trpc.payments.createLeadAcceptanceIntent.useMutation({
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setPublishableKey(data.publishableKey);
    },
  });

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, [publishableKey]);

  if (!clientSecret || !stripePromise) {
    const canContinue =
      tradesmanName.trim().length > 0 && tradesmanEmail.trim().length > 0;
    return (
      <div className="space-y-2 rounded-lg border border-border/80 bg-muted/15 p-3">
        <p className="text-sm font-medium text-foreground">
          Accept this lead (£{TRADESMAN_LEAD_PRICE_GBP} flat fee)
        </p>
        <p className="text-xs text-muted-foreground">
          You&apos;ll be charged when you confirm. No commission — one flat fee per
          accepted lead.
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
        {createIntent.error && (
          <p className="text-sm text-destructive">{createIntent.error.message}</p>
        )}
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={createIntent.isPending || !canContinue}
          onClick={() => {
            const name = tradesmanName.trim();
            const email = tradesmanEmail.trim();
            if (!name || !email) return;
            persistIdentity(name, email);
            createIntent.mutate({ leadId, tradesmanName: name, tradesmanEmail: email });
          }}
        >
          {createIntent.isPending ? "Preparing payment…" : "Continue to payment"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/80 bg-muted/15 p-3">
      <p className="text-sm font-medium text-foreground">Card payment</p>
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PayWithElement onSucceeded={onPaymentSucceeded} />
      </Elements>
    </div>
  );
}
