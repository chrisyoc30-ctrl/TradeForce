"use client";

import { useMemo, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/react";
import { TRADESMAN_LEAD_PRICE_GBP } from "@/lib/pricing";

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
    return (
      <div className="space-y-2 rounded-lg border border-border/80 bg-muted/15 p-3">
        <p className="text-sm font-medium text-foreground">
          Accept this lead (£{TRADESMAN_LEAD_PRICE_GBP} flat fee)
        </p>
        <p className="text-xs text-muted-foreground">
          You&apos;ll be charged when you confirm. No commission — one flat fee per
          accepted lead.
        </p>
        {createIntent.error && (
          <p className="text-sm text-destructive">{createIntent.error.message}</p>
        )}
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={createIntent.isPending}
          onClick={() => createIntent.mutate({ leadId })}
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
