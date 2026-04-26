"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { trpc } from "@/trpc/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { gradeClass } from "@/lib/grade-styles";
import {
  budgetLabel,
  locationLabel,
  projectTypeLabel,
  timelineLabel,
} from "@/components/leads/lead-helpers";
import { getPublicApiBaseUrl } from "@/lib/public-api-base";
import { cn } from "@/lib/utils";

const PHONE_KEY = "tradescore-tradesman-phone";
const NAME_KEY = "tradescore-tradesman-name";
const TRADESPERSON_ID_KEY = "tradescore-tradesperson-id";

function firstNameFromFull(full: string) {
  const t = full.trim();
  if (!t) return "there";
  return t.split(/\s+/)[0] ?? "there";
}

async function fetchValidateTradesId(id: string) {
  const base = getPublicApiBaseUrl();
  if (!base) {
    return { kind: "config" as const };
  }
  const res = await fetch(
    `${base}/api/tradesman/${encodeURIComponent(id.trim())}/validate`,
  );
  if (res.status === 404) {
    return { kind: "invalid" as const };
  }
  if (!res.ok) {
    return { kind: "error" as const };
  }
  const j = (await res.json()) as { valid?: boolean; name?: string };
  if (j.valid && j.name) {
    return { kind: "ok" as const, name: j.name };
  }
  return { kind: "invalid" as const };
}

export default function AvailableJobsPage() {
  const [bidderName, setBidderName] = useState("");
  const [bidderPhone, setBidderPhone] = useState("");
  const [amountByLead, setAmountByLead] = useState<Record<string, string>>({});
  const [noteByLead, setNoteByLead] = useState<Record<string, string>>({});

  const [idInput, setIdInput] = useState("");
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [invalidId, setInvalidId] = useState(false);
  const [idGateReady, setIdGateReady] = useState(false);
  const [idSubmitting, setIdSubmitting] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  const sessionOk = sessionName !== null;

  const utils = trpc.useUtils();
  const { data: projects = [], isLoading } = trpc.tradesman.getMatchedProjects.useQuery(
    undefined,
    {
      refetchInterval: 10_000,
      enabled: idGateReady && sessionOk,
    },
  );

  const submitBid = trpc.bids.submit.useMutation({
    onSuccess: (_, vars) => {
      void utils.bids.getForLead.invalidate({ leadId: vars.leadId });
      void utils.tradesman.getMatchedProjects.invalidate();
    },
  });

  const sorted = useMemo(
    () => [...projects].sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0)),
    [projects],
  );

  const loadBootstrap = useCallback(async () => {
    if (typeof window === "undefined") return;
    setBidderName(window.localStorage.getItem(NAME_KEY) ?? "");
    setBidderPhone(window.localStorage.getItem(PHONE_KEY) ?? "");
    const stored = window.localStorage.getItem(TRADESPERSON_ID_KEY);
    if (!stored?.trim()) {
      setIdGateReady(true);
      setBootstrapping(false);
      return;
    }
    setIdInput(stored);
    const v = await fetchValidateTradesId(stored);
    if (v.kind === "ok") {
      setSessionName(v.name);
    } else {
      window.localStorage.removeItem(TRADESPERSON_ID_KEY);
      if (v.kind === "config") {
        setConfigError("App is not configured with NEXT_PUBLIC_API_URL.");
      } else {
        setInvalidId(true);
      }
    }
    setIdGateReady(true);
    setBootstrapping(false);
  }, []);

  useEffect(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

  function persist(name: string, phone: string) {
    setBidderName(name);
    setBidderPhone(phone);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(NAME_KEY, name);
      window.localStorage.setItem(PHONE_KEY, phone);
    }
  }

  function signOutId() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TRADESPERSON_ID_KEY);
    }
    setSessionName(null);
    setIdInput("");
    setConfigError(null);
    setInvalidId(false);
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Home
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Available jobs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Open leads from the board. Place a bid — homeowners see it on the
            project page.
          </p>
        </div>

        {bootstrapping || !idGateReady ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Checking your details…
          </div>
        ) : !sessionOk ? (
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm text-muted-foreground">
                Enter the tradesperson ID from your TradeScore registration to
                view and bid on leads.
              </p>
              <div className="grid gap-2 max-w-md">
                <Label htmlFor="trades-id">Tradesperson ID</Label>
                <Input
                  id="trades-id"
                  value={idInput}
                  onChange={(e) => {
                    setIdInput(e.target.value.toUpperCase());
                    setConfigError(null);
                    setInvalidId(false);
                  }}
                  placeholder="e.g. TS-A3X9KL"
                  autoComplete="off"
                  disabled={idSubmitting}
                />
              </div>
              {configError ? (
                <p className="text-sm text-destructive" role="alert">
                  {configError}
                </p>
              ) : null}
              {invalidId ? (
                <p className="text-sm text-destructive" role="alert">
                  ID not recognised — please check your signup confirmation or
                  register at{" "}
                  <Link
                    href="/tradesman-signup"
                    className="font-medium text-[#FF6B35] underline underline-offset-2"
                  >
                    /tradesman-signup
                  </Link>
                </p>
              ) : null}
              <Button
                type="button"
                disabled={idSubmitting || !idInput.trim()}
                onClick={async () => {
                  setConfigError(null);
                  setInvalidId(false);
                  setIdSubmitting(true);
                  try {
                    const v = await fetchValidateTradesId(idInput);
                    if (v.kind === "config") {
                      setConfigError(
                        "App is not configured with NEXT_PUBLIC_API_URL.",
                      );
                      return;
                    }
                    if (v.kind === "ok") {
                      if (typeof window !== "undefined") {
                        window.localStorage.setItem(
                          TRADESPERSON_ID_KEY,
                          idInput.trim(),
                        );
                      }
                      setSessionName(v.name);
                      return;
                    }
                    if (typeof window !== "undefined") {
                      window.localStorage.removeItem(TRADESPERSON_ID_KEY);
                    }
                    setInvalidId(true);
                  } finally {
                    setIdSubmitting(false);
                  }
                }}
              >
                {idSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking…
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-lg font-medium text-foreground">
                Welcome back, {firstNameFromFull(sessionName)}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start sm:self-center"
                onClick={signOutId}
              >
                Sign out (clear saved ID)
              </Button>
            </div>

            <Card>
              <CardContent className="space-y-3 p-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="tm-name">Your name (shown to homeowner)</Label>
                    <Input
                      id="tm-name"
                      value={bidderName}
                      onChange={(e) => persist(e.target.value, bidderPhone)}
                      placeholder="e.g. Jamie McAllister"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tm-phone">Your phone number</Label>
                    <Input
                      id="tm-phone"
                      value={bidderPhone}
                      onChange={(e) => persist(bidderName, e.target.value)}
                      placeholder="e.g. 07700 900000"
                      inputMode="tel"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading leads…
              </div>
            ) : sorted.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No open leads right now.{" "}
                <Link href="/lead-scoring" className="underline">
                  Lead scoring board
                </Link>
              </p>
            ) : (
              <ul className="space-y-4">
                {sorted.map((lead) => {
                  const g = gradeClass(lead.aiGrade);
                  const lid = String(lead.id);
                  const amt =
                    amountByLead[lid] ||
                    String(
                      Math.max(
                        100,
                        Math.round(
                          (typeof lead.budget === "number"
                            ? lead.budget
                            : parseFloat(String(lead.budget ?? "0")) || 800) * 0.92,
                        ),
                      ),
                    );
                  const note =
                    noteByLead[lid] ?? "Happy to quote and schedule a visit.";

                  return (
                    <Card key={lid}>
                      <CardContent className="space-y-3 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{projectTypeLabel(lead)}</p>
                            <p className="text-sm text-muted-foreground">
                              {budgetLabel(lead)} · {locationLabel(lead)} ·{" "}
                              {timelineLabel(lead)}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "inline-flex h-10 min-w-10 items-center justify-center rounded-md px-2 text-lg font-bold",
                              g.badge,
                            )}
                          >
                            {lead.aiGrade ?? "—"}
                          </span>
                        </div>
                        <p className="line-clamp-3 text-sm text-muted-foreground">
                          {String(lead.description ?? "")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">
                            Score {lead.aiScore ?? "—"}/100
                          </Badge>
                          <Link
                            href={`/leads/${encodeURIComponent(lid)}`}
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "sm" }),
                              "h-8",
                            )}
                          >
                            Homeowner view
                          </Link>
                        </div>
                        <div className="grid gap-2 border-t border-border/60 pt-3 sm:grid-cols-2">
                          <div className="grid gap-2">
                            <Label htmlFor={`amt-${lid}`}>Your bid (£)</Label>
                            <Input
                              id={`amt-${lid}`}
                              inputMode="decimal"
                              value={amt}
                              onChange={(e) =>
                                setAmountByLead((s) => ({
                                  ...s,
                                  [lid]: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor={`note-${lid}`}>Note</Label>
                            <Textarea
                              id={`note-${lid}`}
                              value={note}
                              onChange={(e) =>
                                setNoteByLead((s) => ({
                                  ...s,
                                  [lid]: e.target.value,
                                }))
                              }
                              className="min-h-[72px]"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          disabled={
                            submitBid.isPending ||
                            bidderPhone.trim().length < 5 ||
                            !bidderName.trim()
                          }
                          onClick={() => {
                            const n = parseFloat(amt);
                            if (Number.isNaN(n) || n <= 0) return;
                            submitBid.mutate({
                              leadId: lid,
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
                      </CardContent>
                    </Card>
                  );
                })}
              </ul>
            )}

            {submitBid.error && (
              <p className="text-sm text-destructive">
                {submitBid.error.message}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
