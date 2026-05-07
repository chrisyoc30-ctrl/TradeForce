"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPublicApiBaseUrl } from "@/lib/public-api-base";
import {
  TRADESMAN_LEAD_PRICE_GBP,
  TRADESMAN_UNLIMITED_MONTHLY_GBP,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

const TS_ID_KEY = "tradescore-tradesperson-id";

const CHECKOUT_RAW =
  (process.env.NEXT_PUBLIC_STRIPE_UNLIMITED_CHECKOUT_URL ?? "").trim();

type SubscriptionPayload = {
  tier?: string;
  status?: string;
  subscription_start_date?: string | null;
  stripe_subscription_id?: string | null;
  leads_accepted_this_month?: number;
  leads_this_month?: number;
};

function buildCheckoutUrl(raw: string, tradeId: string): string {
  const ref = tradeId.trim();
  if (!raw || !ref) return raw;
  try {
    const u = new URL(raw);
    u.searchParams.set("client_reference_id", ref);
    return u.toString();
  } catch {
    const sep = raw.includes("?") ? "&" : "?";
    return `${raw}${sep}client_reference_id=${encodeURIComponent(ref)}`;
  }
}

export default function SubscriptionPage() {
  const [tradeId, setTradeId] = useState("");
  const [data, setData] = useState<SubscriptionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);

  useEffect(() => {
    setTradeId((window.localStorage.getItem(TS_ID_KEY) ?? "").trim());
  }, []);

  const load = useCallback(async () => {
    const tid = tradeId.trim();
    if (!tid) {
      setError(
        "Saved tradesperson ID not found. Enter your ID below (same as Available Jobs).",
      );
      setData(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const base = getPublicApiBaseUrl();
      if (!base) {
        setError("API URL is not configured (NEXT_PUBLIC_API_URL).");
        setData(null);
        return;
      }
      const r = await fetch(
        `${base}/api/tradesperson/${encodeURIComponent(tid)}/subscription`,
        { cache: "no-store" },
      );
      const j = (await r.json().catch(() => ({}))) as SubscriptionPayload & {
        error?: string;
      };
      if (!r.ok) {
        setError(
          typeof j.error === "string" ? j.error : "Could not load subscription.",
        );
        setData(null);
        return;
      }
      setData(j);
    } catch {
      setError("Could not load subscription.");
      setData(null);
    } finally {
      setBusy(false);
    }
  }, [tradeId]);

  useEffect(() => {
    if (!tradeId.trim()) return;
    void load();
  }, [load, tradeId]);

  function applyLocalIdAndRefresh() {
    const t = tradeId.trim();
    if (!t) {
      setError("Enter your tradesperson ID first.");
      return;
    }
    window.localStorage.setItem(TS_ID_KEY, t);
    void load();
  }

  const isUnlimited =
    String(data?.tier ?? "") === "unlimited" &&
    String(data?.status ?? "").toLowerCase() === "active";
  const billingLabel = data?.subscription_start_date
    ? `Member since ${new Date(data.subscription_start_date).toLocaleDateString(
        "en-GB",
        { day: "numeric", month: "short", year: "numeric" },
      )}`
    : null;

  const subscribeHref = useMemo(
    () => (CHECKOUT_RAW ? buildCheckoutUrl(CHECKOUT_RAW, tradeId) : ""),
    [tradeId],
  );

  async function handleCancel() {
    const tid = tradeId.trim();
    if (!tid) return;
    if (
      !window.confirm(
        "Cancel Unlimited in TradeScore records? Stripe billing must be cancelled separately if applicable.",
      )
    )
      return;
    setCancelBusy(true);
    setError(null);
    try {
      const r = await fetch(
        `/api/tradesperson/${encodeURIComponent(tid)}/subscription/cancel`,
        { method: "POST" },
      );
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setError(j.error ?? "Could not cancel.");
        return;
      }
      await load();
    } catch {
      setError("Could not cancel subscription.");
    } finally {
      setCancelBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Subscription
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage Unlimited or stay on £{TRADESMAN_LEAD_PRICE_GBP} pay-per-lead (first lead
            free).
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tradesperson ID</CardTitle>
            <CardDescription>
              Saved on this device — same keys as Available Jobs. Update and apply before
              billing changes.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="grid flex-1 gap-2">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="sub-tid">
                TradeScore ID
              </label>
              <input
                id="sub-tid"
                className={cn(
                  "h-10 rounded-lg border border-border bg-background px-3 text-sm",
                  "outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40",
                )}
                placeholder="TS-ABCDEF"
                value={tradeId}
                autoComplete="off"
                onChange={(e) => setTradeId(e.target.value.trimStart())}
              />
            </div>
            <Button type="button" variant="secondary" onClick={() => applyLocalIdAndRefresh()}>
              Apply & refresh
            </Button>
          </CardContent>
        </Card>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {busy && !data ? (
          <p className="text-sm text-muted-foreground">Fetching subscription…</p>
        ) : null}

        {data && tradeId.trim() ? (
          <Card
            className={cn(isUnlimited && "border-amber-500/40 ring-2 ring-amber-500/20")}
          >
            <CardHeader>
              <CardTitle className="text-base">
                Current plan{" "}
                <span className="font-semibold capitalize text-amber-700 dark:text-amber-400">
                  {isUnlimited ? "Unlimited" : "Pay per lead"}
                </span>
              </CardTitle>
              <CardDescription>
                Status on file:{" "}
                <span className="text-foreground/90 capitalize">
                  {String(data.status ?? "active")}
                </span>
                {billingLabel ? ` · ${billingLabel}` : null}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {isUnlimited ? (
                <>
                  <div className="rounded-lg border border-border/80 bg-muted/20 px-4 py-3">
                    <p className="font-medium text-foreground">Usage this calendar month</p>
                    <p className="mt-2 text-muted-foreground">
                      Leads offered (unlimited matcher):{" "}
                      <strong className="text-foreground">{data.leads_this_month ?? 0}</strong>
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Leads unlocked without per-lead payment:{" "}
                      <strong className="text-foreground">
                        {data.leads_accepted_this_month ?? 0}
                      </strong>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={cancelBusy}
                      onClick={() => void handleCancel()}
                    >
                      {cancelBusy ? "Cancelling…" : "Cancel Unlimited"}
                    </Button>
                    <p className="w-full text-xs text-muted-foreground">
                      Syncs Tier back to pay-per-lead in TradeScore. Finish cancellation in Stripe
                      (customer portal / Dashboard).
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    You unlock leads at £{TRADESMAN_LEAD_PRICE_GBP} each after your free first lead.
                  </p>
                  <div className="overflow-hidden rounded-lg border border-border/70">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/35 text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 font-medium"></th>
                          <th className="px-3 py-2 font-medium">Pay per lead</th>
                          <th className="px-3 py-2 font-medium text-amber-800 dark:text-amber-300">
                            Unlimited
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/70">
                        <tr>
                          <td className="px-3 py-2 text-muted-foreground">Monthly fee</td>
                          <td className="px-3 py-2">£0</td>
                          <td className="px-3 py-2">£{TRADESMAN_UNLIMITED_MONTHLY_GBP}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-muted-foreground">Per-lead unlock</td>
                          <td className="px-3 py-2">
                            £{TRADESMAN_LEAD_PRICE_GBP} • first free
                          </td>
                          <td className="px-3 py-2">Included</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {subscribeHref ? (
                    <Link
                      href={subscribeHref}
                      className={cn(
                        buttonVariants({ size: "default" }),
                        "inline-flex bg-amber-500 font-semibold text-slate-950 hover:bg-amber-400",
                      )}
                    >
                      Upgrade to Unlimited
                    </Link>
                  ) : (
                    <Link
                      href="/pricing"
                      className="text-sm font-medium text-foreground underline underline-offset-2"
                    >
                      View pricing — set NEXT_PUBLIC_STRIPE_UNLIMITED_CHECKOUT_URL
                    </Link>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ) : null}

        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/lead-scoring"
            className="font-medium text-foreground underline underline-offset-2"
          >
            Available leads
          </Link>
          <Link href="/pricing" className="text-muted-foreground underline underline-offset-2">
            Compare plans
          </Link>
        </div>
      </div>
    </div>
  );
}
