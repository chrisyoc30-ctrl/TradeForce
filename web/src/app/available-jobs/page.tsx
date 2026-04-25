"use client";

import { useEffect, useMemo, useState } from "react";
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
  projectTypeLabel,
  timelineLabel,
} from "@/components/leads/lead-helpers";
import { cn } from "@/lib/utils";

const PHONE_KEY = "tradescore-tradesman-phone";
const NAME_KEY = "tradescore-tradesman-name";

export default function AvailableJobsPage() {
  const [bidderName, setBidderName] = useState("");
  const [bidderPhone, setBidderPhone] = useState("");
  const [amountByLead, setAmountByLead] = useState<Record<string, string>>({});
  const [noteByLead, setNoteByLead] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    setBidderName(window.localStorage.getItem(NAME_KEY) ?? "");
    setBidderPhone(window.localStorage.getItem(PHONE_KEY) ?? "");
  }, []);

  const utils = trpc.useUtils();
  const { data: projects = [], isLoading } =
    trpc.tradesman.getMatchedProjects.useQuery(undefined, {
      refetchInterval: 10_000,
    });

  const submitBid = trpc.bids.submit.useMutation({
    onSuccess: (_, vars) => {
      void utils.bids.getForLead.invalidate({ leadId: vars.leadId });
      void utils.tradesman.getMatchedProjects.invalidate();
    },
  });

  const sorted = useMemo(
    () =>
      [...projects].sort(
        (a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0)
      ),
    [projects]
  );

  function persist(name: string, phone: string) {
    setBidderName(name);
    setBidderPhone(phone);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(NAME_KEY, name);
      window.localStorage.setItem(PHONE_KEY, phone);
    }
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
                        : parseFloat(String(lead.budget ?? "0")) || 800) * 0.92
                    )
                  )
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
                          {budgetLabel(lead)} · {timelineLabel(lead)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex h-10 min-w-10 items-center justify-center rounded-md px-2 text-lg font-bold",
                          g.badge
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
                          "h-8"
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
          <p className="text-sm text-destructive">{submitBid.error.message}</p>
        )}
      </div>
    </div>
  );
}
