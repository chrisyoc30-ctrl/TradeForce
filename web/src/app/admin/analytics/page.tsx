"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const q = trpc.admin.getMetrics.useQuery(
    { adminSecret: secret || undefined },
    { enabled: false }
  );

  return (
    <div className="min-h-dvh bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Home
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Admin analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reads aggregated metrics from the Flask API. If{" "}
            <code className="rounded bg-muted px-1 text-xs">ADMIN_SECRET</code>{" "}
            is set on the API, enter the same value below.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST" });
              router.push("/admin/login");
              router.refresh();
            }}
          >
            Log out
          </Button>
        </div>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="grid gap-2 sm:max-w-md">
              <Label htmlFor="admin-secret">Admin secret (optional)</Label>
              <Input
                id="admin-secret"
                type="password"
                autoComplete="off"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Only if ADMIN_SECRET is configured"
              />
            </div>
            <Button
              type="button"
              onClick={() => void q.refetch()}
              disabled={q.isFetching}
            >
              {q.isFetching ? "Loading…" : "Load metrics"}
            </Button>
            {q.error && (
              <p className="text-sm text-destructive">{q.error.message}</p>
            )}
          </CardContent>
        </Card>

        {q.data && (
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard
              title="Total leads"
              value={String(q.data.leads.total)}
            />
            <MetricCard
              title="Average AI score"
              value={q.data.leads.averageScore.toFixed(1)}
            />
            <MetricCard
              title="Total bids"
              value={String(q.data.bidding.total)}
            />
            <MetricCard
              title="Bid acceptance rate"
              value={`${(q.data.bidding.acceptanceRate * 100).toFixed(1)}%`}
            />
            <MetricCard
              title="Paid leads (Stripe)"
              value={String(q.data.leads.paid)}
            />
            <MetricCard
              title="API / DB"
              value={
                q.data.health.database ? "Mongo connected" : "Mongo offline"
              }
            />
          </div>
        )}

        {q.data && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <p className="text-sm font-medium">Recent leads</p>
              </CardHeader>
              <CardContent className="max-h-64 overflow-auto text-xs text-muted-foreground">
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(q.data.activity.recentLeads, null, 2)}
                </pre>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <p className="text-sm font-medium">Recent bids</p>
              </CardHeader>
              <CardContent className="max-h-64 overflow-auto text-xs text-muted-foreground">
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(q.data.activity.recentBids, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
