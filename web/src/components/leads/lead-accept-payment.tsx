"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/trpc/react";
import { TRADESMAN_LEAD_PRICE_GBP } from "@/lib/pricing";

const NAME_KEY = "tradescore-tradesman-name";
const EMAIL_KEY = "tradescore-tradesman-email";
const TS_ID_KEY = "tradescore-tradesperson-id";
const FREE_LEAD_KEY = "tradescore_free_lead_used";

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
  const [freeDialogOpen, setFreeDialogOpen] = useState(false);
  const tradeIdForFreeRef = useRef<string>("");

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

  const runStripeCheckout = async () => {
    persistIdentity(tradesmanName.trim(), tradesmanEmail.trim());
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
  };

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
      window.alert(
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

      const tradeIdForCheck =
        tsId ||
        expectId ||
        (typeof matchedTradespersonId === "string"
          ? matchedTradespersonId.trim()
          : "");

      if (tradeIdForCheck) {
        const cr = await fetch(
          `/api/leads/${encodeURIComponent(leadId)}/check-free-lead?tradeId=${encodeURIComponent(tradeIdForCheck)}`,
          { cache: "no-store" }
        );
        const cj = (await cr.json()) as { canUseFree?: boolean };
        if (cr.ok && cj.canUseFree === true) {
          tradeIdForFreeRef.current = tradeIdForCheck;
          setFreeDialogOpen(true);
          setBusy(false);
          return;
        }
      }

      await runStripeCheckout();
    } catch (err) {
      console.error("Accept lead failed:", err);
      setBusy(false);
    }
  };

  const confirmFreeAccept = async () => {
    const name = tradesmanName.trim();
    const email = tradesmanEmail.trim();
    const tid = tradeIdForFreeRef.current.trim();
    if (!name || !email || !tid) {
      setFreeDialogOpen(false);
      return;
    }

    setBusy(true);
    try {
      const r = await fetch(
        `/api/leads/${encodeURIComponent(leadId)}/accept-free`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tradespersonId: tid,
            fullName: name,
            email,
          }),
        }
      );
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setBusy(false);
        setFreeDialogOpen(false);
        window.alert(j.error ?? "Could not accept this lead for free. Try again or use checkout.");
        return;
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem(FREE_LEAD_KEY, "1");
      }
      persistIdentity(name, email);
      onPaymentSucceeded();
      window.location.assign(
        `/leads/accept-success?free=true&leadId=${encodeURIComponent(leadId)}`
      );
    } catch (e) {
      console.error(e);
      setBusy(false);
      setFreeDialogOpen(false);
      window.alert("Something went wrong. Please try again.");
    }
  };

  const canContinue =
    tradesmanName.trim().length > 0 && tradesmanEmail.trim().length > 0;

  return (
    <>
      <Dialog open={freeDialogOpen} onOpenChange={setFreeDialogOpen}>
        <DialogContent showCloseButton className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your first lead is FREE</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Accept now and we&apos;ll unlock this lead with{" "}
            <strong>no Stripe payment</strong>. Your next accepted leads are £
            {TRADESMAN_LEAD_PRICE_GBP} each.
          </p>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setFreeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={busy}
              onClick={() => void confirmFreeAccept()}
            >
              {busy ? "Confirming…" : "Accept free lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-2 rounded-lg border border-border/80 bg-muted/15 p-3">
        <p className="text-sm font-medium text-foreground">
          Accept this lead (£{TRADESMAN_LEAD_PRICE_GBP} flat fee after your first
          free one)
        </p>
        <p className="text-xs text-muted-foreground">
          You&apos;ll complete payment on Stripe&apos;s secure checkout — unless
          this is your <strong>first lead</strong>, which is free.
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
            ? "Preparing…"
            : `Accept this lead — £${TRADESMAN_LEAD_PRICE_GBP}`}
        </Button>
      </div>
    </>
  );
}
