"use client";

import { useState } from "react";
import Link from "next/link";

import { trpc } from "@/trpc/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { gradeClass } from "@/lib/grade-styles";
import {
  budgetLabel,
  descriptionExcerpt,
  locationLabel,
  projectTypeLabel,
  timelineLabel,
} from "@/components/leads/lead-helpers";
import { cn } from "@/lib/utils";

export default function HomeownerDashboardPage() {
  const [phone, setPhone] = useState("");
  const q = trpc.leads.getUserLeads.useQuery(
    { phone: phone.trim() },
    { enabled: false }
  );

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Homeowner dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Look up jobs you submitted with the same phone number you used on the
        form.
      </p>
      <p className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
        For your security, only jobs submitted with this phone number are
        shown. We recommend not sharing this page with others.
      </p>

      <div className="space-y-3">
        <div className="grid gap-2">
          <Label htmlFor="dash-phone">Phone</Label>
          <Input
            id="dash-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            inputMode="tel"
            placeholder="Same number as on your job post"
          />
        </div>
        <Button
          type="button"
          disabled={phone.trim().length < 8 || q.isFetching}
          onClick={() => void q.refetch()}
        >
          {q.isFetching ? "Loading…" : "Show my projects"}
        </Button>
        {q.error && (
          <p className="text-sm text-destructive">{q.error.message}</p>
        )}
      </div>

      {q.data && q.data.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No projects found for that number yet.{" "}
          <Link href="/lead-capture" className="underline">
            Post a job
          </Link>
        </p>
      )}

      {q.data && q.data.length > 0 && (
        <ul className="space-y-3">
          {q.data.map((lead) => {
            const g = gradeClass(lead.aiGrade);
            const lid = String(lead.id);
            return (
              <Card key={lid}>
                <CardContent className="flex flex-col gap-2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{projectTypeLabel(lead)}</p>
                    <span
                      className={cn(
                        "inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-bold",
                        g.badge
                      )}
                    >
                      {lead.aiGrade ?? "—"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {locationLabel(lead)} · {budgetLabel(lead)} · {timelineLabel(lead)}
                  </p>
                  {lead.description ? (
                    <p className="text-sm text-foreground/90 line-clamp-2">
                      {descriptionExcerpt(lead, 160)}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      Score {lead.aiScore ?? "—"}/100
                    </Badge>
                    {lead.status ? (
                      <Badge variant="secondary" className="capitalize">
                        {String(lead.status)}
                      </Badge>
                    ) : null}
                  </div>
                  <Link
                    href={`/leads/${encodeURIComponent(lid)}`}
                    className={cn(
                      buttonVariants({ size: "sm" }),
                      "w-fit"
                    )}
                  >
                    Open project
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </ul>
      )}

      <Link
        href="/lead-capture"
        className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}
      >
        Post another job
      </Link>
    </div>
  );
}
