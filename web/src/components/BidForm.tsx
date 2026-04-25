"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Lead } from "@/types/lead";

const PHONE_KEY = "tradescore-tradesman-phone";
const NAME_KEY = "tradescore-tradesman-name";

function defaultBidAmount(leadBudget: Lead["budget"]): string {
  const raw =
    typeof leadBudget === "number"
      ? leadBudget
      : parseFloat(String(leadBudget ?? "0").replace(/[£,]/g, "")) || 0;
  const n = Math.max(100, Math.round(raw * 0.92));
  return String(n);
}

export type BidFormProps = {
  leadId: string;
  leadBudget?: Lead["budget"];
  onSuccess?: () => void;
  className?: string;
};

export function BidForm({ leadId, leadBudget, onSuccess, className }: BidFormProps) {
  const [bidderPhone, setBidderPhone] = useState("");
  const [bidderName, setBidderName] = useState("");
  const [amount, setAmount] = useState(() => defaultBidAmount(leadBudget));
  const [note, setNote] = useState("Happy to quote and schedule a visit.");

  useEffect(() => {
    setAmount(defaultBidAmount(leadBudget));
  }, [leadId, leadBudget]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setBidderPhone(window.localStorage.getItem(PHONE_KEY) ?? "");
    setBidderName(window.localStorage.getItem(NAME_KEY) ?? "");
  }, []);

  const utils = trpc.useUtils();
  const submitBid = trpc.bids.submit.useMutation({
    onSuccess: () => {
      void utils.bids.getForLead.invalidate({ leadId });
      void utils.tradesman.getMatchedProjects.invalidate();
      onSuccess?.();
    },
  });

  function persist(name: string, phone: string) {
    setBidderName(name);
    setBidderPhone(phone);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(NAME_KEY, name);
      window.localStorage.setItem(PHONE_KEY, phone);
    }
  }

  const canSubmit =
    bidderPhone.trim().length >= 5 &&
    bidderName.trim().length > 0 &&
    !submitBid.isPending;

  return (
    <div className={className}>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2 sm:max-w-md">
          <Label htmlFor={`bid-tm-name-${leadId}`}>Your name (shown to homeowner)</Label>
          <Input
            id={`bid-tm-name-${leadId}`}
            value={bidderName}
            onChange={(e) => persist(e.target.value, bidderPhone)}
            placeholder="e.g. Jamie McAllister"
            autoComplete="name"
          />
        </div>
        <div className="grid gap-2 sm:col-span-2 sm:max-w-md">
          <Label htmlFor={`bid-tm-phone-${leadId}`}>Your phone number</Label>
          <Input
            id={`bid-tm-phone-${leadId}`}
            value={bidderPhone}
            onChange={(e) => persist(bidderName, e.target.value)}
            placeholder="e.g. 07700 900000"
            autoComplete="tel"
            inputMode="tel"
          />
        </div>
        <div className="grid gap-2 sm:max-w-xs">
          <Label htmlFor={`bid-amt-${leadId}`}>Your bid (£)</Label>
          <Input
            id={`bid-amt-${leadId}`}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor={`bid-note-${leadId}`}>Note</Label>
          <Textarea
            id={`bid-note-${leadId}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[72px]"
          />
        </div>
      </div>
      {submitBid.error && (
        <p className="text-sm text-destructive" role="alert">
          {submitBid.error.message}
        </p>
      )}
      <Button
        type="button"
        className="mt-3 w-full sm:w-auto"
        disabled={!canSubmit}
        onClick={() => {
          const n = parseFloat(amount);
          if (Number.isNaN(n) || n <= 0) return;
          submitBid.mutate({
            leadId,
            amount: n,
            description: note,
            bidderName: bidderName.trim(),
            bidderPhone: bidderPhone.trim(),
          });
        }}
      >
        {submitBid.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Place bid"
        )}
      </Button>
    </div>
  );
}
